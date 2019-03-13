// @flow
import _ from 'lodash';
import fs from 'fs';
import { Commands, openSlpFile, iterateEvents, getMetadata } from './utils/slpReader';

import { getLastFrame, Frames } from "./stats/common";
import { generateConversions } from "./stats/conversions";
import { generateStocks } from "./stats/stocks";
import { generateActionCounts } from "./stats/actions";
import { generateOverall as generateOverallStats } from "./stats/overall";

// Type imports
import type {
  PlayerType, PreFrameUpdateType, PostFrameUpdateType, SlpFileType, MetadataType
} from "./utils/slpReader";
import type {
  StockType, ConversionType, ActionCountsType, OverallType
} from "./stats/common";

type GameSettingsType = {
  stageId: number,
  isTeams: boolean,
  players: PlayerType[]
};

export type FrameEntryType = {
  frame: number,
  players: { [playerIndex: number]: {
    pre: PreFrameUpdateType,
    post: PostFrameUpdateType
  }}
};

type FramesType = {
  [frameIndex: number]: FrameEntryType
};

type StatsType = {
  lastFrame: number,
  playableFrameCount: number,
  stocks: StockType[],
  conversions: ConversionType[],
  actionCounts: ActionCountsType[],
  overall: OverallType[],
};

/**
 * Slippi Game class that wraps a file
 */
export default class SlippiGame {
  filePath: string;
  file: SlpFileType;
  settings: GameSettingsType;
  playerFrames: FramesType;
  followerFrames: FramesType;
  stats: StatsType;
  metadata: MetadataType;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Gets the game settings, these are the settings that describe the starting state of
   * the game such as characters, stage, etc.
   */
  getSettings(): GameSettingsType {
    if (this.settings) {
      // If header is already generated, return it
      return this.settings;
    }

    this.file = openSlpFile(this.filePath);

    // Prepare default settings
    let settings: GameSettingsType = {
      stageId: 0,
      isTeams: false,
      isPAL: false,
      players: []
    };

    // Generate settings from iterating through file
    iterateEvents(this.file, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Commands.GAME_START:
        if (!payload.stageId) {
          return true; // Why do I have to do this? Still not sold on Flow
        }

        settings = payload;
        settings.players = _.filter(payload.players, player => player.type !== 3);
        break;
      case Commands.POST_FRAME_UPDATE:
        if (payload.frame === null || payload.frame > Frames.FIRST) {
          // Once we are an frame -122 or higher we are done getting match settings
          // Tell the iterator to stop
          return true;
        }

        const playerIndex = payload.playerIndex;
        const playersByIndex = _.keyBy(settings.players, 'playerIndex');

        switch (payload.internalCharacterId) {
        case 0x7:
          playersByIndex[playerIndex].characterId = 0x13; // Sheik
          break;
        case 0x13:
          playersByIndex[playerIndex].characterId = 0x12; // Zelda
          break;
        }
        break;
      }

      return false; // Tell the iterator to keep iterating
    });

    this.settings = settings;
    fs.closeSync(this.file.fileDescriptor);
    return settings;
  }

  getFrames(): FramesType {
    if (this.playerFrames) {
      return this.playerFrames;
    }

    this.file = openSlpFile(this.filePath);

    const playerFrames: FramesType = {};
    const followerFrames: FramesType = {};

    iterateEvents(this.file, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Commands.PRE_FRAME_UPDATE:
      case Commands.POST_FRAME_UPDATE:
        if (!payload.frame && payload.frame !== 0) {
          // If payload is messed up, stop iterating. This shouldn't ever happen
          return true;
        }

        const location = command === Commands.PRE_FRAME_UPDATE ? "pre" : "post";
        const frames = payload.isFollower ? followerFrames : playerFrames;
        _.set(frames, [payload.frame, 'players', payload.playerIndex, location], payload);
        _.set(frames, [payload.frame, 'frame'], payload.frame);
        break;
      }

      return false; // Tell the iterator to keep iterating
    });

    this.playerFrames = playerFrames;
    this.followerFrames = followerFrames;
    fs.closeSync(this.file.fileDescriptor);
    return playerFrames;
  }

  getStats(): StatsType {
    if (this.stats) {
      return this.stats;
    }

    this.file = openSlpFile(this.filePath);

    const lastFrame = getLastFrame(this);

    // The order here kind of matters because things later in the call order might
    // reference things calculated earlier. More specifically, currently the overall
    // calculation uses the others
    this.stats = {};
    this.stats.stocks = generateStocks(this);
    this.stats.conversions = generateConversions(this);
    this.stats.actionCounts = generateActionCounts(this);
    this.stats.lastFrame = lastFrame;
    this.stats.playableFrameCount = lastFrame + Math.abs(Frames.FIRST_PLAYABLE);
    this.stats.overall = generateOverallStats(this);

    fs.closeSync(this.file.fileDescriptor);
    return this.stats;
  }

  getMetadata(): MetadataType {
    if (this.metadata) {
      return this.metadata;
    }

    this.file = openSlpFile(this.filePath);

    this.metadata = getMetadata(this.file);

    fs.closeSync(this.file.fileDescriptor);
    return this.metadata;
  }
}

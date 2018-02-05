// @flow
import _ from 'lodash';
import { Commands, openSlpFile, iterateEvents, getMetadata } from './utils/slpReader';
import {
  generatePunishes, generateStocks, getLastFrame
} from "./stats/events";

// Type imports
import type {
  PlayerType, PreFrameUpdateType, PostFrameUpdateType, SlpFileType, MetadataType
} from "./utils/slpReader";
import type { PunishType } from "./stats/events";

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
  events: {
    punishes: PunishType[]
  },
  gameDuration: number
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
    this.file = openSlpFile(filePath);
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

    // Prepare default settings
    const settings: GameSettingsType = {
      stageId: 0,
      isTeams: false,
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

        settings.stageId = payload.stageId;
        settings.isTeams = payload.isTeams;
        settings.players = _.filter(payload.players, player => player.type !== 3);
        break;
      case Commands.POST_FRAME_UPDATE:
        if (!payload.frame) {
          return true; // Why do I have to do this? Still not sold on Flow
        }

        if (payload.frame > -123) {
          // Once we are an frame -122 or higher we are done getting match settings
          // Tell the iterator to stop
          return true;
        }

        const playerIndex = payload.playerIndex;
        switch (payload.internalCharacterId) {
        case 0x7:
          settings.players[playerIndex].characterId = 0x13; // Sheik
          break;
        case 0x13:
          settings.players[playerIndex].characterId = 0x12; // Zelda
          break;
        }
        break;
      }

      return false; // Tell the iterator to keep iterating
    });

    this.settings = settings;
    return settings;
  }

  getFrames(): FramesType {
    if (this.playerFrames) {
      return this.playerFrames;
    }

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
    return playerFrames;
  }

  getStats(): StatsType {
    if (this.stats) {
      return this.stats;
    }

    this.stats = {
      events: {
        stocks: generateStocks(this),
        punishes: generatePunishes(this)
      },
      gameDuration: getLastFrame(this)
    };

    return this.stats;
  }

  getMetadata(): MetadataType {
    if (this.metadata) {
      return this.metadata;
    }

    this.metadata = getMetadata(this.file);

    return this.metadata;
  }
}

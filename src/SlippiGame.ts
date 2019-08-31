/* eslint-disable no-param-reassign */
import _ from 'lodash';
import { Command, openSlpFile, closeSlpFile, iterateEvents, getMetadata, GameStartType, SlpInputSource } from './utils/slpReader';

import { getLastFrame, Frames } from "./stats/common";
import { generateConversions } from "./stats/conversions";
import { generateCombos } from "./stats/combos";
import { generateStocks } from "./stats/stocks";
import { generateActionCounts } from "./stats/actions";
import { generateOverall as generateOverallStats } from "./stats/overall";

// Type imports
import {
  PlayerType, PreFrameUpdateType, PostFrameUpdateType, SlpFileType, MetadataType, GameEndType,
  SlpReadInput
} from "./utils/slpReader";
import {
  StockType, ConversionType, ComboType, ActionCountsType, OverallType
} from "./stats/common";

type GameSettingsType = {
  stageId: number;
  isTeams: boolean;
  players: PlayerType[];
};

export type FrameEntryType = {
  frame: number;
  players: { [playerIndex: number]: {
    pre: PreFrameUpdateType;
    post: PostFrameUpdateType;
  };};
};

type FramesType = {
  [frameIndex: number]: FrameEntryType;
};

type StatsType = {
  gameComplete: boolean;
  lastFrame: number;
  playableFrameCount: number;
  stocks: StockType[];
  conversions: ConversionType[];
  combos: ComboType[];
  actionCounts: ActionCountsType[];
  overall: OverallType[];
};

/**
 * Slippi Game class that wraps a file
 */
export class SlippiGame {
  input: SlpReadInput;
  file: SlpFileType;
  settings: GameSettingsType | null;
  playerFrames: FramesType | null;
  followerFrames: FramesType | null;
  stats: StatsType | null;
  metadata: MetadataType | null;
  gameEnd: GameEndType | null;

  latestFrameIndex: number | null;
  frameReadPos: number | null;

  constructor(input: string | Buffer) {
    if (typeof input === "string") {
      this.input = {
        source: SlpInputSource.FILE,
        filePath: input as string,
      };
    } else if (input instanceof Buffer) {
      this.input = {
        source: SlpInputSource.BUFFER,
        buffer: input,
      };
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }

    this.frameReadPos = null;
    this.latestFrameIndex = null;
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

    const slpfile = openSlpFile(this.input);

    // Prepare default settings
    let settings: GameSettingsType = null;

    // Generate settings from iterating through file
    iterateEvents(slpfile, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Command.GAME_START:
        payload = payload as GameStartType;
        if (!payload.stageId) {
          return true; // Why do I have to do this? Still not sold on Flow
        }

        settings = payload;
        settings.players = payload.players.filter(player => player.type !== 3);
        break;
      case Command.POST_FRAME_UPDATE:
        payload = payload as PostFrameUpdateType;
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
    closeSlpFile(slpfile);
    return settings;
  }

  getLatestFrame(): FrameEntryType | null {
    // TODO: Modify this to check if we actually have all the latest frame data and return that
    // TODO: If we do. For now I'm just going to take a shortcut
    const allFrames = this.getFrames();
    const frameIndex = this.latestFrameIndex || Frames.FIRST;
    const indexToUse = this.gameEnd ? frameIndex : frameIndex - 1;
    return _.get(allFrames, indexToUse) || null;
  }

  getGameEnd(): GameEndType | null {
    if (this.gameEnd) {
      return this.gameEnd;
    }

    // Trigger getFrames because that is where the flag is set
    this.getFrames();
    return this.gameEnd || null;
  }

  getFrames(): FramesType {
    if (this.playerFrames && this.gameEnd) {
      // If game end has been detected, we can returned cached version of frames
      return this.playerFrames;
    }

    const slpfile = openSlpFile(this.input);

    const playerFrames: FramesType = this.playerFrames || {};
    const followerFrames: FramesType = this.followerFrames || {};

    this.frameReadPos = iterateEvents(slpfile, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Command.PRE_FRAME_UPDATE:
      case Command.POST_FRAME_UPDATE:
        payload = payload as PostFrameUpdateType;
        if (!payload.frame && payload.frame !== 0) {
          // If payload is messed up, stop iterating. This shouldn't ever happen
          return true;
        }

        const location = command === Command.PRE_FRAME_UPDATE ? "pre" : "post";
        const frames = payload.isFollower ? followerFrames : playerFrames;
        this.latestFrameIndex = payload.frame;
        _.set(frames, [payload.frame, 'players', payload.playerIndex, location], payload);
        _.set(frames, [payload.frame, 'frame'], payload.frame);
        break;
      case Command.GAME_END:
        payload = payload as GameEndType;
        this.gameEnd = payload;
        break;
      }

      return false; // Tell the iterator to keep iterating
    }, this.frameReadPos);

    this.playerFrames = playerFrames;
    this.followerFrames = followerFrames;
    closeSlpFile(slpfile);
    return playerFrames;
  }

  getStats(): StatsType {
    if (this.stats && this.stats.gameComplete) {
      // If game end has been detected, we can returned cached version stats since they wont change
      return this.stats;
    }

    const slpfile = openSlpFile(this.input);

    const lastFrame = getLastFrame(this);

    // Get playable frame count
    let playableFrameCount = null;
    if (lastFrame !== null) {
      const firstPlayabable = Frames.FIRST_PLAYABLE;
      playableFrameCount = lastFrame < firstPlayabable ? 0 : lastFrame - firstPlayabable;
    }

    // The order here kind of matters because things later in the call order might
    // reference things calculated earlier. More specifically, currently the overall
    // calculation uses the others
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.stats = {} as any;
    this.stats.stocks = generateStocks(this);
    this.stats.conversions = generateConversions(this);
    this.stats.combos = generateCombos(this);
    this.stats.actionCounts = generateActionCounts(this);
    this.stats.lastFrame = lastFrame;
    this.stats.playableFrameCount = playableFrameCount;
    this.stats.overall = generateOverallStats(this);
    this.stats.gameComplete = !!this.gameEnd;

    closeSlpFile(slpfile);

    return this.stats;
  }

  getMetadata(): MetadataType {
    if (this.metadata) {
      return this.metadata;
    }

    const slpfile = openSlpFile(this.input);

    this.metadata = getMetadata(slpfile);

    closeSlpFile(slpfile);
    return this.metadata;
  }
}

/* eslint-enable no-param-reassign */
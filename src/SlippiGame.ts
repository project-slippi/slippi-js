/* eslint-disable no-param-reassign */
import _ from 'lodash';
import { Command, openSlpFile, closeSlpFile, iterateEvents, getMetadata, GameStartType, SlpInputSource } from './utils/slpReader';

// Type imports
import {
  PreFrameUpdateType, PostFrameUpdateType, MetadataType, GameEndType,
  SlpReadInput
} from "./utils/slpReader";
import {
  StockType, ConversionType, ComboType, ActionCountsType, OverallType
} from "./stats/common";
import { SlpParser } from './utils/slpParser';

export type FrameEntryType = {
  frame: number;
  players: { [playerIndex: number]: {
    pre: PreFrameUpdateType;
    post: PostFrameUpdateType;
  };};
};

export type FramesType = {
  [frameIndex: number]: FrameEntryType;
};

export type StatsType = {
  gameComplete: boolean;
  lastFrame: number;
  playableFrameCount: number;
  stocks: StockType[];
  conversions: ConversionType[];
  combos: ComboType[];
  actionCounts: ActionCountsType[];
  overall: OverallType[];
};

export interface SlippiGameInterface {
  getSettings(): GameStartType;
  getLatestFrame(): FrameEntryType | null;
  getGameEnd(): GameEndType | null;
  getFrames(): FramesType;
  getStats(): StatsType;
  getMetadata(): MetadataType;
}


/**
 * Slippi Game class that wraps a file
 */
export class SlippiGame implements SlippiGameInterface {
  private input: SlpReadInput;
  private metadata: MetadataType | null;
  private parser: SlpParser;
  private readPosition: number | null = null;

  public constructor(input: string | Buffer) {
    this.parser = new SlpParser();
    if (_.isString(input)) {
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
  }

  private _process(): void {
    if (this.parser.getGameEnd() !== null) {
      return;
    }
    const slpfile = openSlpFile(this.input);
    // Generate settings from iterating through file
    this.readPosition = iterateEvents(slpfile, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Command.GAME_START:
        payload = payload as GameStartType;
        this.parser.handleGameStart(payload);
        break;
      case Command.POST_FRAME_UPDATE:
        payload = payload as PostFrameUpdateType;
        this.parser.handlePostFrameUpdate(payload);
        this.parser.handleFrameUpdate(command, payload);
        break;
      case Command.PRE_FRAME_UPDATE:
        payload = payload as PreFrameUpdateType;
        this.parser.handleFrameUpdate(command, payload);
        break;
      case Command.GAME_END:
        payload = payload as GameEndType;
        this.parser.handleGameEnd(payload);
        break;
      }

      return false; // Tell the iterator to keep iterating
    }, this.readPosition);
    closeSlpFile(slpfile);
  }

  /**
   * Gets the game settings, these are the settings that describe the starting state of
   * the game such as characters, stage, etc.
   */
  public getSettings(): GameStartType {
    this._process();
    return this.parser.getSettings();
  }

  public getLatestFrame(): FrameEntryType | null {
    this._process();
    return this.parser.getLatestFrame();
  }

  public getGameEnd(): GameEndType | null {
    this._process();
    return this.parser.getGameEnd();
  }

  public getFrames(): FramesType {
    this._process();
    return this.parser.getFrames();
  }

  public getStats(): StatsType {
    this._process();
    return this.parser.getStats();
  }

  public getMetadata(): MetadataType {
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
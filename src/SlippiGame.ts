/* eslint-disable no-param-reassign */
import _ from 'lodash';
import semver from 'semver';
import { Command, openSlpFile, closeSlpFile, iterateEvents, getMetadata, GameStartType, SlpInputSource } from './utils/slpReader';

// Type imports
import {
  PreFrameUpdateType, PostFrameUpdateType, MetadataType, GameEndType,
  SlpReadInput
} from "./utils/slpReader";
import { SlpParser } from './utils/slpParser';
import { FrameEntryType, FramesType, StatsType, Frames } from './stats/common';

/**
 * Slippi Game class that wraps a file
 */
export class SlippiGame {
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

  private _process(settingsOnly = false): void {
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

        // If we only want to fetch settings, check to see if
        // the file was created after the sheik fix so we know
        // we don't have to process the first frame of the game
        if (settingsOnly && semver.gte(payload.slpVersion, "1.6.0")) {
          return true;
        }

        break;
      case Command.POST_FRAME_UPDATE:
        payload = payload as PostFrameUpdateType;
        this.parser.handlePostFrameUpdate(payload);
        this.parser.handleFrameUpdate(command, payload);

        // Once we've reached frame -122, we know we've loaded
        // the first post frame result for all characters, so sheik
        // will have been set properly
        if (settingsOnly && payload.frame > Frames.FIRST) {
          return true;
        }

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

      return false;
    }, this.readPosition);
    closeSlpFile(slpfile);
  }

  /**
   * Gets the game settings, these are the settings that describe the starting state of
   * the game such as characters, stage, etc.
   */
  public getSettings(): GameStartType {
    // Settings is only complete after post-frame update
    this._process(true);
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

  public getFollowerFrames(): FramesType {
    this._process();
    return this.parser.getFollowerFrames();
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
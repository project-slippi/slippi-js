import _ from "lodash";
import semver from "semver";

import {
  PostFrameUpdateType,
  GameStartType,
  GameEndType,
  Command,
  PreFrameUpdateType,
  ItemUpdateType,
  FrameBookendType,
} from "./slpReader";
import {
  Stats,
  FramesType,
  FrameEntryType,
  Frames,
  PlayerIndexedType,
  getSinglesPlayerPermutationsFromSettings,
} from "../stats";

export class SlpParser {
  private statsComputer: Stats;
  private frames: FramesType = {};
  private settings: GameStartType | null = null;
  private gameEnd: GameEndType | null = null;
  private latestFrameIndex: number | null = null;
  private playerPermutations = new Array<PlayerIndexedType>();
  private settingsComplete = false;

  public constructor(statsComputer: Stats) {
    this.statsComputer = statsComputer;
  }

  public getLatestFrameNumber(): number {
    return this.latestFrameIndex;
  }

  public getPlayableFrameCount(): number {
    return this.latestFrameIndex < Frames.FIRST_PLAYABLE ? 0 : this.latestFrameIndex - Frames.FIRST_PLAYABLE;
  }

  public getLatestFrame(): FrameEntryType | null {
    // return this.playerFrames[this.latestFrameIndex];

    // TODO: Modify this to check if we actually have all the latest frame data and return that
    // TODO: If we do. For now I'm just going to take a shortcut
    const allFrames = this.getFrames();
    const frameIndex = this.latestFrameIndex || Frames.FIRST;
    const indexToUse = this.gameEnd ? frameIndex : frameIndex - 1;
    return _.get(allFrames, indexToUse) || null;
  }

  public getSettings(): GameStartType | null {
    return this.settingsComplete ? this.settings : null;
  }

  public getGameEnd(): GameEndType | null {
    return this.gameEnd;
  }

  public getFrames(): FramesType | null {
    return this.frames;
  }

  public handleGameEnd(payload: GameEndType): void {
    payload = payload as GameEndType;
    this.gameEnd = payload;
  }

  public handleGameStart(payload: GameStartType): void {
    this.settings = payload;
    const players = payload.players;
    this.settings.players = players.filter((player) => player.type !== 3);
    this.playerPermutations = getSinglesPlayerPermutationsFromSettings(this.settings);
    this.statsComputer.setPlayerPermutations(this.playerPermutations);

    // Check to see if the file was created after the sheik fix so we know
    // we don't have to process the first frame of the game for the full settings
    if (semver.gte(payload.slpVersion, "1.6.0")) {
      this.settingsComplete = true;
    }
  }

  public handlePostFrameUpdate(payload: PostFrameUpdateType): void {
    if (this.settingsComplete) {
      return;
    }

    // Finish calculating settings
    if (payload.frame <= Frames.FIRST) {
      const playerIndex = payload.playerIndex;
      const playersByIndex = _.keyBy(this.settings.players, "playerIndex");

      switch (payload.internalCharacterId) {
        case 0x7:
          playersByIndex[playerIndex].characterId = 0x13; // Sheik
          break;
        case 0x13:
          playersByIndex[playerIndex].characterId = 0x12; // Zelda
          break;
      }
    }
    this.settingsComplete = payload.frame > Frames.FIRST;
  }

  public handleFrameUpdate(command: Command, payload: PreFrameUpdateType | PostFrameUpdateType): void {
    payload = payload as PostFrameUpdateType;
    const location = command === Command.PRE_FRAME_UPDATE ? "pre" : "post";
    const field = payload.isFollower ? "followers" : "players";
    this.latestFrameIndex = payload.frame;
    _.set(this.frames, [payload.frame, field, payload.playerIndex, location], payload);
    _.set(this.frames, [payload.frame, "frame"], payload.frame);

    // If file is from before frame bookending, add frame to stats computer here. Does a little
    // more processing than necessary, but it works
    const settings = this.getSettings();
    if (!settings || semver.lte(settings.slpVersion, "2.2.0")) {
      this.statsComputer.addFrame(this.frames[payload.frame]);
    } else {
      _.set(this.frames, [payload.frame, "isTransferComplete"], false);
    }
  }

  public handleItemUpdate(command: Command, payload: ItemUpdateType): void {
    const items = _.get(this.frames, [payload.frame, "items"], []);
    items.push(payload);

    // Set items with newest
    _.set(this.frames, [payload.frame, "items"], items);
  }

  public handleFrameBookend(command: Command, payload: FrameBookendType): void {
    _.set(this.frames, [payload.frame, "isTransferComplete"], true);
    this.statsComputer.addFrame(this.frames[payload.frame]);
  }
}

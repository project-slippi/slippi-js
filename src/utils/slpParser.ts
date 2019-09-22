import _ from "lodash";
import semver from 'semver';

import { PostFrameUpdateType, GameStartType, GameEndType, Command, PreFrameUpdateType } from "./slpReader";
import { FramesType, FrameEntryType, Frames, PlayerIndexedType, getSinglesOpponentIndicesFromSettings } from "../stats/common";
import { Stats } from "../stats/stats";

export class SlpParser {
  private statsComputer: Stats;
  private playerFrames: FramesType = {};
  private followerFrames: FramesType = {};
  private settings: GameStartType | null = null;
  private gameEnd: GameEndType | null = null;
  private latestFrameIndex: number | null = null;
  private opponentIndices = new Array<PlayerIndexedType>();
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
    return this.playerFrames;
  }

  public getFollowerFrames(): FramesType | null {
    return this.followerFrames;
  }

  public handleGameEnd(payload: GameEndType): void {
    payload = payload as GameEndType;
    this.gameEnd = payload;
  }

  public handleGameStart(payload: GameStartType): void {
    if (!payload.stageId) {
      return;
    }
    this.settings = payload;
    const players = payload.players;
    this.settings.players = players.filter(player => player.type !== 3);
    this.opponentIndices = getSinglesOpponentIndicesFromSettings(this.settings);
    this.statsComputer.setOpponentIndices(this.opponentIndices);

    // Check to see if the file was created after the sheik fix so we know
    // we don't have to process the first frame of the game for the full settings
    if (semver.gte(payload.slpVersion, "1.6.0")) {
      this.settingsComplete = true;
    }
  }

  public handlePostFrameUpdate(payload: PostFrameUpdateType): void {
    if (payload.frame === null) {
      // Once we are an frame -122 or higher we are done getting match settings
      // Tell the iterator to stop
      return;
    }
    // Finish calculating settings
    if (!this.settingsComplete && payload.frame <= Frames.FIRST) {
      const playerIndex = payload.playerIndex;
      const playersByIndex = _.keyBy(this.settings.players, 'playerIndex');

      switch (payload.internalCharacterId) {
      case 0x7:
        playersByIndex[playerIndex].characterId = 0x13; // Sheik
        break;
      case 0x13:
        playersByIndex[playerIndex].characterId = 0x12; // Zelda
        break;
      }
      this.settingsComplete = true;
    }
  }

  public handleFrameUpdate(command: Command, payload: PreFrameUpdateType | PostFrameUpdateType): void {
    payload = payload as PostFrameUpdateType;
    if (!payload.frame && payload.frame !== 0) {
      // If payload is messed up, stop iterating. This shouldn't ever happen
      return;
    }

    const location = command === Command.PRE_FRAME_UPDATE ? "pre" : "post";
    const frames = payload.isFollower ? this.followerFrames : this.playerFrames;
    this.latestFrameIndex = payload.frame;
    _.set(frames, [payload.frame, 'players', payload.playerIndex, location], payload);
    _.set(frames, [payload.frame, 'frame'], payload.frame);

    this.statsComputer.addFrame(frames[payload.frame]);
  }
}

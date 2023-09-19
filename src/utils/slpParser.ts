import { EventEmitter } from "events";
import get from "lodash/get";
import keyBy from "lodash/keyBy";
import set from "lodash/set";
import semver from "semver";

import type {
  EnabledItemType,
  FrameBookendType,
  FrameEntryType,
  FrameStartType,
  FramesType,
  GameEndType,
  GameStartType,
  GeckoListType,
  ItemUpdateType,
  PostFrameUpdateType,
  PreFrameUpdateType,
  RollbackFrames,
} from "../types";
import { ItemSpawnType } from "../types";
import { Command, Frames, GameMode } from "../types";
import { exists } from "./exists";
import { RollbackCounter } from "./rollbackCounter";

// There are 5 bytes of item bitfields that can be enabled
const ITEM_SETTINGS_BIT_COUNT = 40;
export const MAX_ROLLBACK_FRAMES = 7;

export enum SlpParserEvent {
  SETTINGS = "settings",
  END = "end",
  FRAME = "frame", // Emitted for every frame
  FINALIZED_FRAME = "finalized-frame", // Emitted for only finalized frames
  ROLLBACK_FRAME = "rollback-frame", // Emitted if a frame is being replaced
}

// If strict mode is on, we will do strict validation checking
// which could throw errors on invalid data.
// Default to false though since probably only real time applications
// would care about valid data.
const defaultSlpParserOptions = {
  strict: false,
};

export type SlpParserOptions = typeof defaultSlpParserOptions;

export class SlpParser extends EventEmitter {
  private frames: FramesType = {};
  private rollbackCounter: RollbackCounter = new RollbackCounter();
  private settings: GameStartType | null = null;
  private gameEnd: GameEndType | null = null;
  private latestFrameIndex: number | null = null;
  private settingsComplete = false;
  private lastFinalizedFrame = Frames.FIRST - 1;
  private options: SlpParserOptions;
  private geckoList: GeckoListType | null = null;

  public constructor(options?: Partial<SlpParserOptions>) {
    super();
    this.options = Object.assign({}, defaultSlpParserOptions, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public handleCommand(command: Command, payload: any): void {
    switch (command) {
      case Command.GAME_START:
        this._handleGameStart(payload as GameStartType);
        break;
      case Command.FRAME_START:
        this._handleFrameStart(payload as FrameStartType);
        break;
      case Command.POST_FRAME_UPDATE:
        // We need to handle the post frame update first since that
        // will finalize the settings object, before we fire the frame update
        this._handlePostFrameUpdate(payload as PostFrameUpdateType);
        this._handleFrameUpdate(command, payload as PostFrameUpdateType);
        break;
      case Command.PRE_FRAME_UPDATE:
        this._handleFrameUpdate(command, payload as PreFrameUpdateType);
        break;
      case Command.ITEM_UPDATE:
        this._handleItemUpdate(payload as ItemUpdateType);
        break;
      case Command.FRAME_BOOKEND:
        this._handleFrameBookend(payload as FrameBookendType);
        break;
      case Command.GAME_END:
        this._handleGameEnd(payload as GameEndType);
        break;
      case Command.GECKO_LIST:
        this._handleGeckoList(payload as GeckoListType);
        break;
    }
  }

  /**
   * Resets the parser state to their default values.
   */
  public reset(): void {
    this.frames = {};
    this.settings = null;
    this.gameEnd = null;
    this.latestFrameIndex = null;
    this.settingsComplete = false;
    this.lastFinalizedFrame = Frames.FIRST - 1;
  }

  public getLatestFrameNumber(): number {
    return this.latestFrameIndex ?? Frames.FIRST - 1;
  }

  public getPlayableFrameCount(): number {
    if (this.latestFrameIndex === null) {
      return 0;
    }
    return this.latestFrameIndex < Frames.FIRST_PLAYABLE ? 0 : this.latestFrameIndex - Frames.FIRST_PLAYABLE;
  }

  public getLatestFrame(): FrameEntryType | null {
    // return this.playerFrames[this.latestFrameIndex];

    // TODO: Modify this to check if we actually have all the latest frame data and return that
    // TODO: If we do. For now I'm just going to take a shortcut
    const allFrames = this.getFrames();
    const frameIndex = this.latestFrameIndex !== null ? this.latestFrameIndex : Frames.FIRST;
    const indexToUse = this.gameEnd ? frameIndex : frameIndex - 1;
    return get(allFrames, indexToUse) || null;
  }

  public getSettings(): GameStartType | null {
    return this.settingsComplete ? this.settings : null;
  }

  public getItems(): EnabledItemType[] | null {
    if (this.settings?.itemSpawnBehavior === ItemSpawnType.OFF) {
      return null;
    }

    const itemBitfield = this.settings?.enabledItems;
    if (!exists(itemBitfield)) {
      return null;
    }

    const enabledItems: EnabledItemType[] = [];

    // Ideally we would be able to do this with bitshifting instead, but javascript
    // truncates numbers after 32 bits when doing bitwise operations
    for (let i = 0; i < ITEM_SETTINGS_BIT_COUNT; i++) {
      if (Math.floor(itemBitfield / 2 ** i) & 1) {
        enabledItems.push(2 ** i);
      }
    }

    return enabledItems;
  }

  public getGameEnd(): GameEndType | null {
    return this.gameEnd;
  }

  public getFrames(): FramesType {
    return this.frames;
  }

  public getRollbackFrames(): RollbackFrames {
    return {
      frames: this.rollbackCounter.getFrames(),
      count: this.rollbackCounter.getCount(),
      lengths: this.rollbackCounter.getLengths(),
    };
  }

  public getFrame(num: number): FrameEntryType | null {
    return this.frames[num] || null;
  }

  public getGeckoList(): GeckoListType | null {
    return this.geckoList;
  }

  private _handleGeckoList(payload: GeckoListType): void {
    this.geckoList = payload;
  }

  private _handleGameEnd(payload: GameEndType): void {
    // Finalize remaining frames if necessary
    if (this.latestFrameIndex !== null && this.latestFrameIndex !== this.lastFinalizedFrame) {
      this._finalizeFrames(this.latestFrameIndex);
    }

    this.gameEnd = payload;
    this.emit(SlpParserEvent.END, this.gameEnd);
  }

  private _handleGameStart(payload: GameStartType): void {
    this.settings = payload;
    const players = payload.players;
    this.settings.players = players.filter((player) => player.type !== 3);

    // Check to see if the file was created after the sheik fix so we know
    // we don't have to process the first frame of the game for the full settings
    if (payload.slpVersion && semver.gte(payload.slpVersion, "1.6.0")) {
      this._completeSettings();
    }
  }

  private _handleFrameStart(payload: FrameStartType): void {
    const currentFrameNumber = payload.frame!;

    set(this.frames, [currentFrameNumber, "start"], payload);
  }

  private _handlePostFrameUpdate(payload: PostFrameUpdateType): void {
    if (this.settingsComplete) {
      return;
    }

    // Finish calculating settings
    if (payload.frame! <= Frames.FIRST) {
      const playerIndex = payload.playerIndex!;
      const playersByIndex = keyBy(this.settings!.players, "playerIndex");

      switch (payload.internalCharacterId) {
        case 0x7:
          playersByIndex[playerIndex]!.characterId = 0x13; // Sheik
          break;
        case 0x13:
          playersByIndex[playerIndex]!.characterId = 0x12; // Zelda
          break;
      }
    }
    if (payload.frame! > Frames.FIRST) {
      this._completeSettings();
    }
  }

  private _handleFrameUpdate(command: Command, payload: PreFrameUpdateType | PostFrameUpdateType): void {
    const location = command === Command.PRE_FRAME_UPDATE ? "pre" : "post";
    const field = payload.isFollower ? "followers" : "players";
    const currentFrameNumber = payload.frame!;
    this.latestFrameIndex = currentFrameNumber;
    if (location === "pre" && !payload.isFollower) {
      const currentFrame = this.frames[currentFrameNumber];
      const wasRolledback = this.rollbackCounter.checkIfRollbackFrame(currentFrame, payload.playerIndex!);
      if (wasRolledback) {
        // frame is about to be overwritten
        this.emit(SlpParserEvent.ROLLBACK_FRAME, currentFrame);
      }
    }
    set(this.frames, [currentFrameNumber, field, payload.playerIndex!, location], payload);
    set(this.frames, [currentFrameNumber, "frame"], currentFrameNumber);

    // If file is from before frame bookending, add frame to stats computer here. Does a little
    // more processing than necessary, but it works
    const settings = this.getSettings();
    if (settings && (!settings.slpVersion || semver.lte(settings.slpVersion, "2.2.0"))) {
      this.emit(SlpParserEvent.FRAME, this.frames[currentFrameNumber]);
      // Finalize the previous frame since no bookending exists
      this._finalizeFrames(currentFrameNumber - 1);
    } else {
      set(this.frames, [currentFrameNumber, "isTransferComplete"], false);
    }
  }

  private _handleItemUpdate(payload: ItemUpdateType): void {
    const currentFrameNumber = payload.frame!;
    const items = this.frames[currentFrameNumber]?.items ?? [];
    items.push(payload);

    // Set items with newest
    set(this.frames, [currentFrameNumber, "items"], items);
  }

  private _handleFrameBookend(payload: FrameBookendType): void {
    const latestFinalizedFrame = payload.latestFinalizedFrame!;
    const currentFrameNumber = payload.frame!;
    set(this.frames, [currentFrameNumber, "isTransferComplete"], true);
    // Fire off a normal frame event
    this.emit(SlpParserEvent.FRAME, this.frames[currentFrameNumber]);

    // Finalize frames if necessary
    const validLatestFrame = this.settings!.gameMode === GameMode.ONLINE;
    if (validLatestFrame && latestFinalizedFrame >= Frames.FIRST) {
      // Ensure valid latestFinalizedFrame
      if (this.options.strict && latestFinalizedFrame < currentFrameNumber - MAX_ROLLBACK_FRAMES) {
        throw new Error(`latestFinalizedFrame should be within ${MAX_ROLLBACK_FRAMES} frames of ${currentFrameNumber}`);
      }
      this._finalizeFrames(latestFinalizedFrame);
    } else {
      // Since we don't have a valid finalized frame, just finalize the frame based on MAX_ROLLBACK_FRAMES
      this._finalizeFrames(currentFrameNumber - MAX_ROLLBACK_FRAMES);
    }
  }

  /**
   * Fires off the FINALIZED_FRAME event for frames up until a certain number
   * @param num The frame to finalize until
   */
  private _finalizeFrames(num: number): void {
    while (this.lastFinalizedFrame < num) {
      const frameToFinalize = this.lastFinalizedFrame + 1;
      const frame = this.getFrame(frameToFinalize)!;

      // Check that we have all the pre and post frame data for all players if we're in strict mode
      if (this.options.strict) {
        for (const player of this.settings!.players) {
          const playerFrameInfo = frame.players[player.playerIndex];
          // Allow player frame info to be empty in non 1v1 games since
          // players which have been defeated will have no frame info.
          if (this.settings!.players.length > 2 && !playerFrameInfo) {
            continue;
          }

          const { pre, post } = playerFrameInfo!;
          if (!pre || !post) {
            const preOrPost = pre ? "pre" : "post";
            throw new Error(
              `Could not finalize frame ${frameToFinalize} of ${num}: missing ${preOrPost}-frame update for player ${player.playerIndex}`,
            );
          }
        }
      }

      // Our frame is complete so finalize the frame
      this.emit(SlpParserEvent.FINALIZED_FRAME, frame);
      this.lastFinalizedFrame = frameToFinalize;
    }
  }

  private _completeSettings(): void {
    if (!this.settingsComplete) {
      this.settingsComplete = true;
      this.emit(SlpParserEvent.SETTINGS, this.settings);
    }
  }
}

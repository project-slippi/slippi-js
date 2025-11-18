import get from "lodash/get";

import type { FrameEntryType, FramesType, GameStartType } from "../types";
import { Frames } from "../types";

export interface StatComputer<T> {
  setup(settings: GameStartType): void;
  processFrame(newFrame: FrameEntryType, allFrames: FramesType): void;
  fetch(): T;
}

export type StatOptions = {
  processOnTheFly: boolean;
};

const defaultOptions: StatOptions = {
  processOnTheFly: false,
};

export class Stats {
  private options: StatOptions;
  private lastProcessedFrame: number | null = null;
  private frames: FramesType = {};
  private players: number[] = [];
  private allComputers = new Array<StatComputer<unknown>>();

  public constructor(options?: StatOptions) {
    this.options = Object.assign({}, defaultOptions, options);
  }

  /**
   * Should reset the frames to their default values.
   */
  public setup(settings: GameStartType): void {
    // Reset the frames since it's a new game
    this.frames = {};
    this.players = settings.players.map((v) => v.playerIndex);

    // Forward the settings on to the individual stat computer
    this.allComputers.forEach((comp) => comp.setup(settings));
  }

  public register(...computer: StatComputer<unknown>[]): void {
    this.allComputers.push(...computer);
  }

  public process(): void {
    if (this.players.length === 0) {
      return;
    }

    let i = this.lastProcessedFrame !== null ? this.lastProcessedFrame + 1 : Frames.FIRST;
    while (this.frames[i]) {
      const frame = this.frames[i];
      // Don't attempt to compute stats on frames that have not been fully received
      if (!isCompletedFrame(this.players, frame)) {
        return;
      }
      this.allComputers.forEach((comp) => comp.processFrame(frame, this.frames));
      this.lastProcessedFrame = i;
      i++;
    }
  }

  public addFrame(frame: FrameEntryType): void {
    this.frames[frame.frame] = frame;

    if (this.options.processOnTheFly) {
      this.process();
    }
  }
}

function isCompletedFrame(players: number[], frame?: FrameEntryType): frame is FrameEntryType {
  if (!frame) {
    return false;
  }

  // This function checks whether we have successfully received an entire frame.
  // It is not perfect because it does not wait for follower frames. Fortunately,
  // follower frames are not used for any stat calculations so this doesn't matter
  // for our purposes.
  for (const player of players) {
    const playerPostFrame = get(frame, ["players", player, "post"]);
    if (!playerPostFrame) {
      return false;
    }
  }

  return true;
}

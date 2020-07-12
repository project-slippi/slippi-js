import _ from 'lodash';

import { FrameEntryType, PlayerIndexedType, Frames, FramesType } from './common';

export interface StatComputer<T> {
  setPlayerPermutations(indices: PlayerIndexedType[]): void;
  processFrame(newFrame: FrameEntryType, allFrames: FramesType): void;
  fetch(): T;
}

export interface StatOptions {
  processOnTheFly: boolean;
}

const defaultOptions: StatOptions = {
  processOnTheFly: false,
};

export class Stats {
  private options: StatOptions;
  private lastProcessedFrame: number | null = null;
  private frames: FramesType = {};
  private playerPermutations = new Array<PlayerIndexedType>();
  private allComputers = new Array<StatComputer<unknown>>();

  public constructor(options?: StatOptions) {
    this.options = Object.assign({}, defaultOptions, options);
  }

  public setPlayerPermutations(indices: PlayerIndexedType[]): void {
    this.playerPermutations = indices;
    this.allComputers.forEach((comp) => comp.setPlayerPermutations(indices));
  }

  public register(...computer: StatComputer<unknown>[]): void {
    this.allComputers.push(...computer);
  }

  public process(): void {
    if (this.playerPermutations.length === 0) {
      return;
    }
    let i = this.lastProcessedFrame ? this.lastProcessedFrame + 1 : Frames.FIRST;
    while (this.frames[i]) {
      const frame = this.frames[i];
      // Don't attempt to compute stats on frames that have not been fully received
      if (!isCompletedFrame(this.playerPermutations, frame)) {
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

function isCompletedFrame(playerPermutations: PlayerIndexedType[], frame: FrameEntryType): boolean {
  // This function checks whether we have successfully received an entire frame.
  // It is not perfect because it does not wait for follower frames. Fortunately,
  // follower frames are not used for any stat calculations so this doesn't matter
  // for our purposes.
  const indices = _.first(playerPermutations);
  const playerPostFrame = _.get(frame, ['players', indices.playerIndex, 'post']);
  const oppPostFrame = _.get(frame, ['players', indices.opponentIndex, 'post']);

  return Boolean(playerPostFrame && oppPostFrame);
}

import { FrameEntryType, RollbackFramesType } from "../types";

export class RollbackCounter {
  private rollbackFrames: RollbackFramesType = {};
  private rollbackFrameCount = 0;
  private rollbackPlayerIdx: number | null = null; // for keeping track of rollbacks by following a single player
  private lastFrameWasRollback = false;
  private currentRollbackLength = 0;
  private rollbackLengths: number[] = [];

  public checkIfRollbackFrame(currentFrame: FrameEntryType | undefined, playerIdx: number) {
    if (this.rollbackPlayerIdx === null) {
      // we only want to follow a single player to avoid double counting. So we use whoever is on first.
      this.rollbackPlayerIdx = playerIdx;
    } else if (this.rollbackPlayerIdx !== playerIdx) {
      return;
    }

    if (currentFrame) {
      // frame already exists for currentFrameNumber so we must be rolling back
      if (this.rollbackFrames[currentFrame.frame]) {
        this.rollbackFrames[currentFrame.frame].push(currentFrame);
      } else {
        this.rollbackFrames[currentFrame.frame] = [currentFrame];
      }
      this.rollbackFrameCount++;
      this.currentRollbackLength++;
      this.lastFrameWasRollback = true;
    } else if (this.lastFrameWasRollback) {
      this.rollbackLengths.push(this.currentRollbackLength);
      this.currentRollbackLength = 0;
      this.lastFrameWasRollback = false;
    }
    return this.lastFrameWasRollback;
  }

  public getFrames() {
    return this.rollbackFrames;
  }

  public getCount() {
    return this.rollbackFrameCount;
  }

  public getLengths() {
    return this.rollbackLengths;
  }
}

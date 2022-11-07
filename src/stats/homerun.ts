import { EventEmitter } from "events";

import type { FrameEntryType, FramesType } from "../types";
import { positionToHomerunDistance } from "../utils/homerunDistance";
import type { StatComputer } from "./stats";

export class HomerunComputer extends EventEmitter implements StatComputer<number> {
  private gameDistance = 0;

  public setup(): void {
    // Reset the state
    this.gameDistance = 0;
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    const distance = calculateDistance(allFrames, frame, this.gameDistance);
    if (distance > this.gameDistance) {
      this.gameDistance = distance;
      this.emit("DISTANCE INCREASE", {
        distance: this.gameDistance,
      });
    }
  }

  public fetch(): number {
    return positionToHomerunDistance(this.gameDistance);
  }
}

function calculateDistance(frames: FramesType, frame: FrameEntryType, gameDistance: number): number {
  const currentFrameNumber = frame.frame;
  const sandbag = frames[currentFrameNumber]?.players[1]?.post;

  if (sandbag && sandbag.internalCharacterId === 32 && (sandbag.positionX as number) > gameDistance) {
    return sandbag.positionX as number;
  }

  return gameDistance;
}

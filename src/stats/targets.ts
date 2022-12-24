import { EventEmitter } from "events";
import { last } from "lodash";

import type { FrameEntryType, FramesType, GameStartType } from "../types";
import { GameMode } from "../types";
import type { TargetBreakType } from "./common";
import type { StatComputer } from "./stats";

// The Target item's in-game ID
const TARGET_ITEM_TYPE_ID = 209;

export class TargetBreakComputer extends EventEmitter implements StatComputer<TargetBreakType[]> {
  private targetBreaks = new Array<TargetBreakType>();
  private isTargetTestGame = false;

  public constructor() {
    super();
  }

  public setup(settings: GameStartType): void {
    // Reset the state
    this.targetBreaks = [];
    this.isTargetTestGame = settings.gameMode === GameMode.TARGET_TEST;
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    if (!this.isTargetTestGame) {
      return;
    }

    const targetBreak = handleTargetBreak(allFrames, frame, this.targetBreaks);
    if (targetBreak) {
      this.emit("TARGET BREAK", {
        targetBreaks: last(this.targetBreaks),
      });
    }
  }

  public fetch(): TargetBreakType[] {
    return this.targetBreaks;
  }
}

function handleTargetBreak(frames: FramesType, frame: FrameEntryType, targetBreaks: TargetBreakType[]): boolean {
  const currentFrameNumber = frame.frame;
  const prevFrameNumber = currentFrameNumber - 1;

  // Add all targets on the first frame
  if (currentFrameNumber === -123) {
    const targets = frames[-123]?.items?.filter((item) => item.typeId === TARGET_ITEM_TYPE_ID) ?? [];

    targets.forEach((target) => {
      targetBreaks.push({
        spawnId: target.spawnId as number,
        frameDestroyed: null,
        positionX: target.positionX as number,
        positionY: target.positionY as number,
      } as TargetBreakType);
    });
  }

  const currentTargets = frames[currentFrameNumber]?.items?.filter((item) => item.typeId === TARGET_ITEM_TYPE_ID);
  const previousTargets = frames[prevFrameNumber]?.items?.filter((item) => item.typeId === TARGET_ITEM_TYPE_ID);

  const currentTargetIds = currentTargets?.map((item) => item.spawnId) ?? [];
  const previousTargetIds = previousTargets?.map((item) => item.spawnId) ?? [];

  // Check if any targets were destroyed
  const brokenTargetIds = previousTargetIds?.filter((id) => !currentTargetIds?.includes(id));

  if (brokenTargetIds.length > 0) {
    brokenTargetIds.forEach((id) => {
      // Update the target break
      const targetBreak = targetBreaks.find((targetBreak) => targetBreak.spawnId === id);
      if (targetBreak) {
        targetBreak.frameDestroyed = currentFrameNumber;
      }
    });
    return true;
  }

  return false;
}

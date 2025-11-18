import type { FrameEntryType, FramesType, GameStartType } from "../types";
import { Frames, GameMode } from "../types";
import { exists } from "../utils/exists";
import type { TargetBreakType } from "./common";
import type { StatComputer } from "./stats";

// The Target item's in-game ID
const TARGET_ITEM_TYPE_ID = 209;

export class TargetBreakComputer implements StatComputer<TargetBreakType[]> {
  private targetBreaks = new Array<TargetBreakType>();
  private isTargetTestGame = false;

  public setup(settings: GameStartType): void {
    // Reset the state
    this.targetBreaks = [];
    this.isTargetTestGame = settings.gameMode === GameMode.TARGET_TEST;
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    if (!this.isTargetTestGame) {
      return;
    }

    handleTargetBreak(allFrames, frame, this.targetBreaks);
  }

  public fetch(): TargetBreakType[] {
    return this.targetBreaks;
  }
}

function handleTargetBreak(frames: FramesType, frame: FrameEntryType, targetBreaks: TargetBreakType[]) {
  const currentFrameNumber = frame.frame;
  const prevFrameNumber = currentFrameNumber - 1;

  // Add all targets on the first frame
  if (currentFrameNumber === Frames.FIRST) {
    const targets = frames[Frames.FIRST]?.items?.filter((item) => item.typeId === TARGET_ITEM_TYPE_ID) ?? [];

    targets.forEach((target) => {
      targetBreaks.push({
        spawnId: target.spawnId as number,
        frameDestroyed: null,
        positionX: target.positionX as number,
        positionY: target.positionY as number,
      });
    });
  }

  const currentTargets = frames[currentFrameNumber]?.items?.filter((item) => item.typeId === TARGET_ITEM_TYPE_ID) ?? [];
  const previousTargets = frames[prevFrameNumber]?.items?.filter((item) => item.typeId === TARGET_ITEM_TYPE_ID) ?? [];

  const currentTargetIds = currentTargets.map((item) => item.spawnId).filter(exists);
  const previousTargetIds = previousTargets.map((item) => item.spawnId).filter(exists);

  // Check if any targets were destroyed
  const brokenTargetIds = previousTargetIds.filter((id) => !currentTargetIds.includes(id));
  brokenTargetIds.forEach((id) => {
    // Update the target break
    const targetBreak = targetBreaks.find((targetBreak) => targetBreak.spawnId === id);
    if (targetBreak) {
      targetBreak.frameDestroyed = currentFrameNumber;
    }
  });
}

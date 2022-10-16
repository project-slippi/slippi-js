import { format } from "date-fns";

import type { GameStartType } from "../types";
import { TimerType } from "../types";
import { exists } from "./exists";

export function frameToGameTimer(
  frame: number,
  options: Pick<GameStartType, "timerType" | "startingTimerSeconds">,
): string {
  const { timerType, startingTimerSeconds } = options;

  if (timerType === TimerType.DECREASING) {
    if (!exists(startingTimerSeconds)) {
      return "Unknown";
    }
    const centiseconds = Math.ceil((((60 - (frame % 60)) % 60) * 99) / 59);
    const date = new Date(0, 0, 0, 0, 0, startingTimerSeconds - frame / 60, centiseconds * 10);
    return format(date, "mm:ss.SS");
  }

  if (timerType === TimerType.INCREASING) {
    const centiseconds = Math.floor(((frame % 60) * 99) / 59);
    const date = new Date(0, 0, 0, 0, 0, frame / 60, centiseconds * 10);
    return format(date, "mm:ss.SS");
  }

  return "Infinite";
}

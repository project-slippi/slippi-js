import type { GameStartType } from "..";
import { TimerType } from "..";
import { format } from "date-fns";

export function frameToGameTimer(frame: number, gameStart: GameStartType): string {
  const timerType = gameStart.timerType;

  if (timerType == TimerType.DECREASING) {
    const centiseconds = Math.ceil((((60 - (frame % 60)) % 60) * 99) / 59);
    const date = new Date(0, 0, 0, 0, 0, (gameStart.startingTimerSeconds as number) - frame / 60, centiseconds * 10);
    return format(date, "mm:ss.SS");
  }

  if (timerType == TimerType.INCREASING) {
    const centiseconds = Math.floor(((frame % 60) * 99) / 59);
    const date = new Date(0, 0, 0, 0, 0, frame / 60, centiseconds * 10);
    return format(date, "mm:ss.SS");
  }

  return "";
}

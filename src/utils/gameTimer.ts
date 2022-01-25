import moment from "moment";
import { GameInfoType, TimerType } from "..";

export function frameToGameTimer(frame: number, gameInfo: GameInfoType): string {
  const timerType = ((gameInfo.gameBitfield1 as number) & 0b11) as TimerType;

  if (timerType == TimerType.DECREASING) {
    const centiseconds = Math.ceil((((60 - (frame % 60)) % 60) * 99) / 59);
    const date = new Date(0, 0, 0, 0, 0, (gameInfo.startingTimerFrames as number) - frame / 60, centiseconds * 10);
    return moment(date).format("mm:ss.SS");
  }

  if (timerType == TimerType.INCREASING) {
    const centiseconds = Math.floor(((frame % 60) * 99) / 59);
    const date = new Date(0, 0, 0, 0, 0, frame / 60, centiseconds * 10);
    return moment(date).format("mm:ss.SS");
  }

  return "";
}

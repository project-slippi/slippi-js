import { TimerType } from "..";
import { frameToGameTimer } from "./gameTimer";

describe("when calculating the in-game timer", () => {
  it("should calculate the timer correctly when increasing", () => {
    const increasing_settings = {
      timerType: TimerType.INCREASING,
      startingTimerSeconds: 0,
    };

    expect(frameToGameTimer(2014, increasing_settings)).toBe("00:33.57");
  });

  it("should calculate the timer correctly when the limit is hit", () => {
    const limit_settings = {
      timerType: TimerType.DECREASING,
      startingTimerSeconds: 180,
    };

    expect(frameToGameTimer(10800, limit_settings)).toBe("00:00.00");
  });

  it("should calculate the timer correctly when decreasing", () => {
    const decreasing_settings = {
      timerType: TimerType.DECREASING,
      startingTimerSeconds: 180,
    };

    expect(frameToGameTimer(4095, decreasing_settings)).toBe("01:51.76");
  });
});

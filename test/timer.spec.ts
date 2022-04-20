import { GameStartType, SlippiGame } from "../src";
import { frameToGameTimer } from "../src/utils/gameTimer";

describe("when calculating the in-game timer", () => {
  it("should calculate the timer correctly when increasing", () => {
    const timer_increasing = new SlippiGame("./slp/timer_increasing.slp");
    const timer_increasing_gameinfo = timer_increasing.getSettings();
    expect(frameToGameTimer(2014, timer_increasing_gameinfo as GameStartType)).toBe("00:33.57");
  });

  it("should calcualte the timer correctly when the limit is hit", () => {
    const timer_limit = new SlippiGame("./slp/timer_limit.slp");
    const timer_limit_gameinfo = timer_limit.getSettings();
    expect(frameToGameTimer(10800, timer_limit_gameinfo as GameStartType)).toBe("00:00.00");
  });

  it("should calculate the timer correctly when decreasing", () => {
    const timer_decreasing = new SlippiGame("./slp/timer_decreasing.slp");
    const timer_decreasing_gameinfo = timer_decreasing.getSettings();
    expect(frameToGameTimer(4095, timer_decreasing_gameinfo as GameStartType)).toBe("01:51.76");
  });
});

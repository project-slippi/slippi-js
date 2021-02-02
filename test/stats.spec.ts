import { SlippiGame } from "../src";
import { didLoseStock } from "../src/stats/common";

const expectedThrow = {
  up: 1,
  forward: 1,
  back: 2,
  down: 1
};

const expectedGrab = {
  success: 6,
  fail: 2
};

describe("when calculating stats", () => {
  it("should correctly calculate L cancel counts", () => {
    const game = new SlippiGame("slp/lCancel.slp");
    const stats = game.getStats();
    const p1Success = stats.actionCounts[0].lCancelSuccessCount;
    const p1Fail = stats.actionCounts[0].lCancelFailCount;
    expect(p1Success).toBe(3);
    expect(p1Fail).toBe(4);
    const p2Success = stats.actionCounts[1].lCancelSuccessCount;
    const p2Fail = stats.actionCounts[1].lCancelFailCount;
    expect(p2Success).toBe(5);
    expect(p2Fail).toBe(4);
  });
  it("should correctly calculate throw counts", () => {
    const game = new SlippiGame("slp/throwGrab.slp");
    const stats = game.getStats();
    const p2Throws = stats.actionCounts[1].throwCounts;
    expect(p2Throws).toEqual(expectedThrow);
  });
  it("should correctly calculate grab counts", () => {
    const game = new SlippiGame("slp/throwGrab.slp");
    const stats = game.getStats();
    const p2Grabs = stats.actionCounts[1].grabCounts;
    expect(p2Grabs).toEqual(expectedGrab);
  });
});
describe("when using common functions", () => {
  it("Should return false if required", () => {
    expect(didLoseStock(undefined,undefined)).toEqual(false)
  });
});

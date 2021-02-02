import { SlippiGame } from "../src";
import { didLoseStock } from "../src/stats/common";

const expectedThrow = {
  up: 1,
  forward: 1,
  back: 2,
  down: 1,
};

const expectedGrab = {
  success: 6,
  fail: 2,
};
const slippiDefault = {
  playerIndex: 0,
  opponentIndex: [2],
  inputCounts: {
    buttons: 150,
    triggers: 0,
    cstick: 35,
    joystick: 309,
    total: 494,
  },
  conversionCount: 8,
  totalDamage: 359.28001403808594,
  killCount: 4,
  successfulConversions: {
    count: 6,
    total: 8,
    ratio: 0.75,
  },
  inputsPerMinute: {
    count: 494,
    total: 1.0369444444444444,
    ratio: 476.39967854272703,
  },
  digitalInputsPerMinute: {
    count: 150,
    total: 1.0369444444444444,
    ratio: 144.65577283686042,
  },
  openingsPerKill: {
    count: 8,
    total: 4,
    ratio: 2,
  },
  damagePerOpening: {
    count: 359.28001403808594,
    total: 8,
    ratio: 44.91000175476074,
  },
  neutralWinRatio: [
    {
      count: 8,
      total: 8,
      ratio: 1,
    },
  ],
  counterHitRatio: [
    {
      count: 0,
      total: 2,
      ratio: 0,
    },
  ],
  beneficialTradeRatio: [
    {
      count: 0,
      total: 0,
      ratio: null,
    },
  ],
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
  it("should match output of test.slp", () => {
    const game = new SlippiGame("slp/test.slp");
    const stats = game.getStats();
    expect(stats.overall[0]).toEqual(slippiDefault);
  });
});
describe("when using common functions", () => {
  it("Should return false if required", () => {
    expect(didLoseStock(undefined, undefined)).toEqual(false);
  });
});

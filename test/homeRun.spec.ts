import { SlippiGame } from "../src/node/index";
import { HomeRunContestResultType } from "../src/common/index";
import { positionToHomeRunDistance } from "../src/common/utils/homeRunDistance";

describe("when processing homerun contest replays", () => {
  it("should correctly calculate the distance for negative-distance hits", () => {
    const inGameUnits = -12345.6;
    const homeRunDistance = positionToHomeRunDistance(inGameUnits);

    expect(homeRunDistance).toBe(0);
  });

  it("should correctly calculate the distance for positive-distance hits", () => {
    const game = new SlippiGame("slp/homeRun_positive.slp");
    const stadiumStats = game.getStadiumStats() as HomeRunContestResultType;

    expect(stadiumStats.distance).toBeCloseTo(1070.9, 0);
  });

  it("should correctly calculate the distance for japanese replays", () => {
    const game = new SlippiGame("slp/homeRun_jp.slp");
    const stadiumStats = game.getStadiumStats() as HomeRunContestResultType;

    expect(stadiumStats.distance).toBeCloseTo(110.8, 0);
  });

  it("should correctly skip processing for non-HRC replays", () => {
    const game = new SlippiGame("slp/facingDirection.slp");
    const stadiumStats = game.getStadiumStats() as HomeRunContestResultType;

    expect(stadiumStats).not.toBeDefined();
  });
});

import { TargetTestResultType } from "../src/common/index";
import { SlippiGame } from "../src/node/index";

describe("when processing break the target replays", () => {
  it("should correctly count the target breaks", () => {
    const game = new SlippiGame("./slp/BTTDK.slp");
    const stadiumStats = game.getStadiumStats()!;
    expect(stadiumStats).not.toBeNull();
    expect(stadiumStats.type).toEqual("target-test");
    const targetsBroken = (stadiumStats as TargetTestResultType).targetBreaks.filter((t) => t.frameDestroyed).length;
    expect(targetsBroken).toEqual(10);
  });

  it("should correctly skip processing for non-HRC replays", () => {
    const game = new SlippiGame("./slp/facingDirection.slp");
    const stadiumStats = game.getStadiumStats();
    expect(stadiumStats).toBeNull();
  });
});

import { SlippiGame, TargetTestResultType } from "../src";

describe("when processing break the target replays", () => {
  it("should correctly count the target breaks", () => {
    const game = new SlippiGame("./slp/BTTDK.slp");
    const stadiumStats = game.getStadiumStats() as TargetTestResultType;
    const targetsBroken = stadiumStats.targetBreaks.filter((t) => t.frameDestroyed).length;

    expect(targetsBroken).toEqual(10);
  });
});

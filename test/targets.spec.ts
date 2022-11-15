import { frameToGameTimer, GameStartType, SlippiGame } from "../src";

describe("when processing break the target replays", () => {
  it("should correctly count the target breaks", () => {
    const game = new SlippiGame("./slp/BTTDK.slp");
    const stats = game.getStats();
    const targetBreaks = stats?.targetBreaks;
    const targetsBroken = targetBreaks?.filter((t) => t.frameDestroyed).length;

    expect(targetsBroken).toEqual(10);
  });
});

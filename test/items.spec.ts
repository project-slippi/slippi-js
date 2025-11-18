import { Frames, SlippiGame } from "../src/node/index";

describe("when extracting item information", () => {
  it("should monotonically increment item spawn id", () => {
    const game = new SlippiGame("slp/itemExport.slp");
    const frames = game.getFrames();

    let lastSpawnId = -1;
    for (let frameNum = Frames.FIRST; frames[frameNum]; frameNum++) {
      const frame = frames[frameNum];
      if (frame.items) {
        frame.items.forEach((i) => {
          if (lastSpawnId < i.spawnId) {
            expect(i.spawnId).toBe(lastSpawnId + 1);
            lastSpawnId = i.spawnId;
          }
        });
      }
    }
  });

  it("should have valid owner values", () => {
    const game = new SlippiGame("slp/itemExport.slp");
    const frames = game.getFrames();

    for (let frameNum = Frames.FIRST; frames[frameNum]; frameNum++) {
      const frame = frames[frameNum];
      if (frame.items) {
        frame.items.forEach((i) => {
          // The owner must be between -1 and 3
          expect(i.owner).toBeLessThanOrEqual(3);
          expect(i.owner).toBeGreaterThanOrEqual(-1);
        });
      }
    }
  });
});

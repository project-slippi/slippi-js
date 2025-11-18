import { SlippiGame } from "../src/node/index";
import { Frames, StadiumTransformationEvent, FodPlatformSide, WhispyBlowDirection } from "../src/common/index";

describe("when extracting stadium transformation information", () => {
  it("should properly increment event ids", () => {
    const game = new SlippiGame("slp/stadiumTransformations.slp");
    const frames = game.getFrames();

    let lastEventId = -1;
    let lastTransformationId = -1;
    for (let frameNum = Frames.FIRST; frames[frameNum]; frameNum++) {
      const frame = frames[frameNum];
      if (frame.stageEvents) {
        frame.stageEvents.forEach((e) => {
          if (e.transformation != lastTransformationId) {
            expect(e.event).toBe(StadiumTransformationEvent.INITIATE);
            lastTransformationId = e.transformation;
            lastEventId = e.event;
          } else {
            expect(e.event).toBe((lastEventId + 1) % 7);
            lastEventId = e.event;
          }
        });
      }
    }
  });
});

describe("when extracting FOD platform information", () => {
  it("should properly parse platform height", () => {
    const game = new SlippiGame("slp/FodPlatforms.slp");
    const frames = game.getFrames();

    let prevHeightLeft = 20.0;
    let prevHeightRight = 28.0;
    for (let frameNum = Frames.FIRST; frames[frameNum]; frameNum++) {
      const frame = frames[frameNum];
      if (frame.stageEvents) {
        frame.stageEvents.forEach((e) => {
          if (e.platform == FodPlatformSide.LEFT) {
            expect(Math.abs(e.height - prevHeightLeft)).toBeLessThan(0.2);
            prevHeightLeft = e.height;
          } else {
            expect(Math.abs(e.height - prevHeightRight)).toBeLessThan(0.2);
            prevHeightRight = e.height;
          }
        });
      }
    }
  });
});

describe("when extracting Dreamland Whispy information", () => {
  it("should properly parse blow directions", () => {
    const game = new SlippiGame("slp/Whispy.slp");
    const frames = game.getFrames();

    let prevBlowDirection = WhispyBlowDirection.NONE;
    for (let frameNum = Frames.FIRST; frames[frameNum]; frameNum++) {
      const frame = frames[frameNum];
      if (frame.stageEvents) {
        frame.stageEvents.forEach((e) => {
          if (prevBlowDirection == WhispyBlowDirection.LEFT) {
            expect(e.direction).toBe(WhispyBlowDirection.NONE);
          } else if (prevBlowDirection == WhispyBlowDirection.RIGHT) {
            expect(e.direction).toBe(WhispyBlowDirection.NONE);
          } else {
            expect(e.direction).not.toBe(WhispyBlowDirection.NONE);
          }

          prevBlowDirection = e.direction;
        });
      }
    }
  });
});

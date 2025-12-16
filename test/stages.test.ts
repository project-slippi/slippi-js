import { SlippiGame } from "../src/node/index";
import {
  Frames,
  StadiumTransformationEvent,
  FodPlatformSide,
  WhispyBlowDirection,
  StadiumTransformationType,
  FodPlatformType,
  WhispyType,
} from "../src/common/index";

describe("when extracting stadium transformation information", () => {
  it("should properly increment event ids", () => {
    const game = new SlippiGame("slp/stadiumTransformations.slp");
    const frames = game.getFrames();

    let lastEventId = -1;
    let lastTransformationId = -1;
    for (let frameNum = Frames.FIRST; frames[frameNum]; frameNum++) {
      const frame = frames[frameNum]!;
      if (frame.stageEvents) {
        frame.stageEvents.forEach((e) => {
          const stadiumEvent = e as StadiumTransformationType;
          if (stadiumEvent.transformation != lastTransformationId) {
            expect(stadiumEvent.event).toBe(StadiumTransformationEvent.INITIATE);
            lastTransformationId = stadiumEvent.transformation!;
            lastEventId = stadiumEvent.event!;
          } else {
            expect(stadiumEvent.event).toBe((lastEventId + 1) % 7);
            lastEventId = stadiumEvent.event!;
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
      const frame = frames[frameNum]!;
      if (frame.stageEvents) {
        frame.stageEvents.forEach((e) => {
          const fodEvent = e as FodPlatformType;
          if (fodEvent.platform == FodPlatformSide.LEFT) {
            expect(Math.abs(fodEvent.height! - prevHeightLeft)).toBeLessThan(0.2);
            prevHeightLeft = fodEvent.height!;
          } else {
            expect(Math.abs(fodEvent.height! - prevHeightRight)).toBeLessThan(0.2);
            prevHeightRight = fodEvent.height!;
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
      const frame = frames[frameNum]!;
      if (frame.stageEvents) {
        frame.stageEvents.forEach((e) => {
          const whispyEvent = e as WhispyType;
          if (prevBlowDirection == WhispyBlowDirection.LEFT) {
            expect(whispyEvent.direction).toBe(WhispyBlowDirection.NONE);
          } else if (prevBlowDirection == WhispyBlowDirection.RIGHT) {
            expect(whispyEvent.direction).toBe(WhispyBlowDirection.NONE);
          } else {
            expect(whispyEvent.direction).not.toBe(WhispyBlowDirection.NONE);
          }

          prevBlowDirection = whispyEvent.direction!;
        });
      }
    }
  });
});

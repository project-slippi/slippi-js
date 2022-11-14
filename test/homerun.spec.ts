import { positionToHomeRunDistance } from "../src/utils/homeRunDistance";

describe("when processing homerun contest replays", () => {
  it("should correctly calculate the distance for negative-distance hits", () => {
    const inGameUnits = -12345.6;
    const homeRunDistance = positionToHomeRunDistance(inGameUnits);
    expect(homeRunDistance).toBe(0);
  });

  it("should correctly calculate the distance for positive-distance hits", () => {
    const inGameUnits = 3331.287353515625;
    const homeRunDistance = positionToHomeRunDistance(inGameUnits);
    expect(homeRunDistance).toBeCloseTo(1070.9, 0);
  });
});

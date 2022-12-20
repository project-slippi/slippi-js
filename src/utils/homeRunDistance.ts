const FEET_CONVERSION_FACTOR = 0.952462;
const METERS_CONVERSION_FACTOR = 1.04167;

export function positionToHomeRunDistance(distance: number, units: "feet" | "meters" = "feet"): number {
  let score = 0;

  if (units === "feet") {
    score = 10 * Math.floor(distance - 70 * FEET_CONVERSION_FACTOR);
    // convert to float32
    score = Math.fround(score);
    score = Math.floor((score / 30.4788) * 10) / 10;
  } else {
    score = 10 * Math.floor(distance - 70 * METERS_CONVERSION_FACTOR);
    // convert to float32
    score = Math.fround(score);
    score = Math.floor((score / 100) * 10) / 10;
  }

  // round to 1 decimal
  score = Math.round(score * 10) / 10;

  return Math.max(0, score);
}

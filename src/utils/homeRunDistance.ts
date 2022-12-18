export function positionToHomeRunDistance(distance: number, units: "feet" | "meters" = "feet"): number {
  // In NTSC vs. PAL, meters are different sizes
  const feetModeConversionFactor = 0.952462;
  const metersModeConversionFactor = 1.04167;
  let score = 0;

  if (units === "feet") {
    score = 10 * Math.floor(distance - 70 * feetModeConversionFactor);
    // convert to float32
    score = Math.fround(score);
    score = Math.floor((score / 30.4788) * 10) / 10;
  } else {
    score = 10 * Math.floor(distance - 70 * metersModeConversionFactor);
    // convert to float32
    score = Math.fround(score);
    score = Math.floor((score / 100) * 10) / 10;
  }

  // round to 1 decimal
  score = Math.round(score * 10) / 10;

  return Math.max(0, score);
}

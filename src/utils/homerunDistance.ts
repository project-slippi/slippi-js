// Returns the recorded homerun distance in FEET given the in-game position of the sandbag.
// The conversion from internal game units to feet and meters is not currently perfectly understood.
// As such, homerun distance is currently an approximation of the recorded value for some extremely large values.
export function positionToHomerunDistance(distance: number): number {
  // In NTSC vs. PAL, meters are different sizes
  const feetModeConversionFactor = 0.952462;
  //const metersModeConversionFactor = 1.04167;

  const metersInFeedMode = (distance - 71 * feetModeConversionFactor) / 10;
  const magicConversionFactor = 30.4787998199462;
  const score = Math.round(metersInFeedMode * 100);

  const interimValue1 = score / magicConversionFactor;

  const interimValue2 =
    Math.round(Math.pow(2, 23 - Math.floor(Math.log2(interimValue1))) * interimValue1) /
    Math.pow(2, 23 - Math.floor(Math.log2(interimValue1)));

  const recordedDistance =
    Math.floor(
      Math.round(Math.pow(2, 23 - Math.floor(Math.log2(interimValue2 * 10))) * interimValue2 * 10) /
        Math.pow(2, 23 - Math.floor(Math.log2(interimValue2 * 10))),
    ) / 10;

  return recordedDistance > 0 ? recordedDistance : 0;
}

import type { FrameEntryType, GameStartType } from "../types";
import { Language } from "../types";
import { exists } from "./exists";

const SANDBAG_INTERNAL_ID = 32;

const FEET_CONVERSION_FACTOR = 0.952462;
const METERS_CONVERSION_FACTOR = 1.04167;

type HomeRunDistanceUnits = "feet" | "meters";

export function positionToHomeRunDistance(distance: number, units: HomeRunDistanceUnits = "feet"): number {
  let score = 0;
  switch (units) {
    case "feet":
      score = 10 * Math.floor(distance - 70 * FEET_CONVERSION_FACTOR);
      // convert to float32
      score = Math.fround(score);
      score = Math.floor((score / 30.4788) * 10) / 10;
      break;
    case "meters":
      score = 10 * Math.floor(distance - 70 * METERS_CONVERSION_FACTOR);
      // convert to float32
      score = Math.fround(score);
      score = Math.floor((score / 100) * 10) / 10;
      break;
    default:
      throw new Error(`Unsupported units: ${units}`);
  }

  // round to 1 decimal
  score = Math.round(score * 10) / 10;
  return Math.max(0, score);
}

export function extractDistanceInfoFromFrame(
  settings: Pick<GameStartType, "language">,
  lastFrame: Pick<FrameEntryType, "players">,
): { distance: number; units: HomeRunDistanceUnits } | null {
  const sandbagLastFrame = Object.values(lastFrame.players)
    .filter(exists)
    .find((playerFrame) => playerFrame.post.internalCharacterId === SANDBAG_INTERNAL_ID);

  if (!sandbagLastFrame) {
    return null;
  }

  // Only return the distance in meters if it's a Japanese replay.
  // Technically we should check if the replay is PAL but we don't yet support
  // stadium replays in PAL.
  const units: HomeRunDistanceUnits = settings.language === Language.JAPANESE ? "meters" : "feet";
  const distance = positionToHomeRunDistance(sandbagLastFrame.post.positionX ?? 0, units);
  return {
    distance,
    units,
  };
}

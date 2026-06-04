import type { GameStartType } from "../types.js";
import { groupBy, keyBy } from "../utils/lang.js";
import type { ConversionType, InputCountsType, OverallType, RatioType } from "./common.js";
import type { PlayerInput } from "./inputs.js";

type ConversionsByPlayerByOpening = {
  [playerIndex: string]: {
    [openingType: string]: ConversionType[];
  };
};

export function generateOverallStats({
  settings,
  inputs,
  conversions,
  playableFrameCount,
}: {
  settings: GameStartType;
  inputs: PlayerInput[];
  conversions: ConversionType[];
  playableFrameCount: number;
}): OverallType[] {
  const inputsByPlayer = keyBy(inputs, (input) => input.playerIndex);
  const originalConversions = conversions;
  const conversionsByPlayer = groupBy(conversions, (conv) => conv.moves[0]?.playerIndex ?? -1);
  const conversionsByPlayerByOpening: ConversionsByPlayerByOpening = Object.fromEntries(
    Object.entries(conversionsByPlayer).map(([key, convs]) => [key, groupBy(convs, (conv) => conv.openingType)]),
  );

  const gameMinutes = playableFrameCount / 3600;

  const overall = settings.players.map((player) => {
    const playerIndex = player.playerIndex;

    const playerInputs = inputsByPlayer[String(playerIndex)];
    const inputCounts: InputCountsType = {
      buttons: playerInputs?.buttonInputCount ?? 0,
      triggers: playerInputs?.triggerInputCount ?? 0,
      cstick: playerInputs?.cstickInputCount ?? 0,
      joystick: playerInputs?.joystickInputCount ?? 0,
      total: playerInputs?.inputCount ?? 0,
    };
    // const conversions = get(conversionsByPlayer, playerIndex) || [];
    // const successfulConversions = conversions.filter((conversion) => conversion.moves.length > 1);
    let conversionCount = 0;
    let successfulConversionCount = 0;

    const opponentIndices = settings.players
      .filter((opp) => {
        // We want players which aren't ourselves
        if (opp.playerIndex === playerIndex) {
          return false;
        }

        // Make sure they're not on our team either
        return !settings.isTeams || opp.teamId !== player.teamId;
      })
      .map((opp) => opp.playerIndex);

    let totalDamage = 0;
    let killCount = 0;

    // These are the conversions that we did on our opponents
    originalConversions
      // Filter down to conversions of our opponent
      .filter((conversion) => conversion.playerIndex !== playerIndex)
      .forEach((conversion) => {
        conversionCount++;

        // We killed the opponent
        if (conversion.didKill && conversion.lastHitBy === playerIndex) {
          killCount += 1;
        }
        if (conversion.moves.length > 1 && conversion.moves[0]!.playerIndex === playerIndex) {
          successfulConversionCount++;
        }
        conversion.moves.forEach((move) => {
          if (move.playerIndex === playerIndex) {
            totalDamage += move.damage;
          }
        });
      });

    return {
      playerIndex: playerIndex,
      inputCounts: inputCounts,
      conversionCount: conversionCount,
      totalDamage: totalDamage,
      killCount: killCount,

      successfulConversions: getRatio(successfulConversionCount, conversionCount),
      inputsPerMinute: getRatio(inputCounts.total, gameMinutes),
      digitalInputsPerMinute: getRatio(inputCounts.buttons, gameMinutes),
      openingsPerKill: getRatio(conversionCount, killCount),
      damagePerOpening: getRatio(totalDamage, conversionCount),
      neutralWinRatio: getOpeningRatio(conversionsByPlayerByOpening, playerIndex, opponentIndices, "neutral-win"),
      counterHitRatio: getOpeningRatio(conversionsByPlayerByOpening, playerIndex, opponentIndices, "counter-attack"),
      beneficialTradeRatio: getBeneficialTradeRatio(conversionsByPlayerByOpening, playerIndex, opponentIndices),
    };
  });

  return overall;
}

function getRatio(count: number, total: number): RatioType {
  return {
    count: count,
    total: total,
    ratio: total ? count / total : undefined,
  };
}

function getOpeningRatio(
  conversionsByPlayerByOpening: ConversionsByPlayerByOpening,
  playerIndex: number,
  opponentIndices: number[],
  type: string,
): RatioType {
  const openings = conversionsByPlayerByOpening[String(playerIndex)]?.[type] ?? [];

  const opponentOpenings = opponentIndices.flatMap(
    (opponentIndex) => conversionsByPlayerByOpening[String(opponentIndex)]?.[type] ?? [],
  );

  return getRatio(openings.length, openings.length + opponentOpenings.length);
}

function getBeneficialTradeRatio(
  conversionsByPlayerByOpening: ConversionsByPlayerByOpening,
  playerIndex: number,
  opponentIndices: number[],
): RatioType {
  const playerTrades = conversionsByPlayerByOpening[String(playerIndex)]?.["trade"] ?? [];
  const opponentTrades = opponentIndices.flatMap(
    (opponentIndex) => conversionsByPlayerByOpening[String(opponentIndex)]?.["trade"] ?? [],
  );

  const benefitsPlayer = [];

  // Figure out which punishes benefited this player
  const len = Math.min(playerTrades.length, opponentTrades.length);
  for (let i = 0; i < len; i++) {
    const playerConversion = playerTrades[i];
    const opponentConversion = opponentTrades[i];
    if (playerConversion && opponentConversion) {
      const playerDamage = playerConversion.currentPercent - playerConversion.startPercent;
      const opponentDamage = opponentConversion.currentPercent - opponentConversion.startPercent;

      if (playerConversion.didKill && !opponentConversion.didKill) {
        benefitsPlayer.push(playerConversion);
      } else if (playerDamage > opponentDamage) {
        benefitsPlayer.push(playerConversion);
      }
    }
  }

  return getRatio(benefitsPlayer.length, playerTrades.length);
}

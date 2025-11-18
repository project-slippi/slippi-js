import first from "lodash/first";
import flatten from "lodash/flatten";
import get from "lodash/get";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import last from "lodash/last";
import mapValues from "lodash/mapValues";
import zip from "lodash/zip";

import type { GameStartType } from "../types";
import type { ConversionType, InputCountsType, OverallType, RatioType } from "./common";
import type { PlayerInput } from "./inputs";

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
  const inputsByPlayer = keyBy(inputs, "playerIndex");
  const originalConversions = conversions;
  const conversionsByPlayer = groupBy(conversions, (conv) => conv.moves[0]?.playerIndex);
  const conversionsByPlayerByOpening: ConversionsByPlayerByOpening = mapValues(conversionsByPlayer, (conversions) =>
    groupBy(conversions, "openingType"),
  );

  const gameMinutes = playableFrameCount / 3600;

  const overall = settings.players.map((player) => {
    const playerIndex = player.playerIndex;

    const playerInputs = get(inputsByPlayer, playerIndex) || {};
    const inputCounts: InputCountsType = {
      buttons: get(playerInputs, "buttonInputCount"),
      triggers: get(playerInputs, "triggerInputCount"),
      cstick: get(playerInputs, "cstickInputCount"),
      joystick: get(playerInputs, "joystickInputCount"),
      total: get(playerInputs, "inputCount"),
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
    ratio: total ? count / total : null,
  };
}

function getOpeningRatio(
  conversionsByPlayerByOpening: ConversionsByPlayerByOpening,
  playerIndex: number,
  opponentIndices: number[],
  type: string,
): RatioType {
  const openings = get(conversionsByPlayerByOpening, [playerIndex, type]) || [];

  const opponentOpenings = flatten(
    opponentIndices.map((opponentIndex) => get(conversionsByPlayerByOpening, [opponentIndex, type]) || []),
  );

  return getRatio(openings.length, openings.length + opponentOpenings.length);
}

function getBeneficialTradeRatio(
  conversionsByPlayerByOpening: ConversionsByPlayerByOpening,
  playerIndex: number,
  opponentIndices: number[],
): RatioType {
  const playerTrades = get(conversionsByPlayerByOpening, [playerIndex, "trade"]) || [];
  const opponentTrades = flatten(
    opponentIndices.map((opponentIndex) => get(conversionsByPlayerByOpening, [opponentIndex, "trade"]) || []),
  );

  const benefitsPlayer = [];

  // Figure out which punishes benefited this player
  const zippedTrades = zip(playerTrades, opponentTrades);
  zippedTrades.forEach((conversionPair) => {
    const playerConversion = first(conversionPair);
    const opponentConversion = last(conversionPair);
    if (playerConversion && opponentConversion) {
      const playerDamage = playerConversion.currentPercent - playerConversion.startPercent;
      const opponentDamage = opponentConversion.currentPercent - opponentConversion.startPercent;

      if (playerConversion!.didKill && !opponentConversion!.didKill) {
        benefitsPlayer.push(playerConversion);
      } else if (playerDamage > opponentDamage) {
        benefitsPlayer.push(playerConversion);
      }
    }
  });

  return getRatio(benefitsPlayer.length, playerTrades.length);
}

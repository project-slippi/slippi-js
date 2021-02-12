import _ from "lodash";
import { GameStartType } from "../types";
import { ConversionType, StockType, OverallType, RatioType, InputCountsType } from "./common";
import { PlayerInput } from "./inputs";

interface ConversionsByPlayerByOpening {
  [playerIndex: string]: {
    [openingType: string]: ConversionType[];
  };
}

export function generateOverallStats(
  settings: GameStartType,
  inputs: PlayerInput[],
  stocks: StockType[],
  conversions: ConversionType[],
  playableFrameCount: number,
): OverallType[] {
  const inputsByPlayer = _.keyBy(inputs, "playerIndex");
  const conversionsByPlayer = _.groupBy(conversions, (conv) => conv.moves[0]?.playerIndex);
  const conversionsByPlayerByOpening: ConversionsByPlayerByOpening = _.mapValues(conversionsByPlayer, (conversions) =>
    _.groupBy(conversions, "openingType"),
  );

  const gameMinutes = playableFrameCount / 3600;

  const overall = settings.players.map((player) => {
    const playerIndex = player.playerIndex;
    const playerInputs = _.get(inputsByPlayer, playerIndex) || {};
    const inputCounts: InputCountsType = {
      buttons: _.get(playerInputs, "buttonInputCount"),
      triggers: _.get(playerInputs, "triggerInputCount"),
      cstick: _.get(playerInputs, "cstickInputCount"),
      joystick: _.get(playerInputs, "joystickInputCount"),
      total: _.get(playerInputs, "inputCount"),
    };
    const conversions = _.get(conversionsByPlayer, playerIndex) || [];
    const successfulConversions = conversions.filter((conversion) => conversion.moves.length > 1);

    const conversionCount = conversions.length;
    const successfulConversionCount = successfulConversions.length;

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
    const opponentStocks = _.get(conversionsByPlayer, playerIndex) || [];
    const opponentEndedStocks = _.filter(opponentStocks, "endFrame");
    opponentEndedStocks.forEach((conversion) => {
      conversion.moves.forEach((move) => {
        if (move.playerIndex === playerIndex) {
          // We hit the opponent
          totalDamage += move.damage;
        }
      });

      if (conversion.didKill && conversion.lastHitBy === playerIndex) {
        killCount += 1;
      }
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
  const openings = _.get(conversionsByPlayerByOpening, [playerIndex, type]) || [];

  const opponentOpenings = _.flatten(
    opponentIndices.map((opponentIndex) => _.get(conversionsByPlayerByOpening, [opponentIndex, type]) || []),
  );

  return getRatio(openings.length, openings.length + opponentOpenings.length);
}

function getBeneficialTradeRatio(
  conversionsByPlayerByOpening: ConversionsByPlayerByOpening,
  playerIndex: number,
  opponentIndices: number[],
): RatioType {
  const playerTrades = _.get(conversionsByPlayerByOpening, [playerIndex, "trade"]) || [];
  const opponentTrades = _.flatten(
    opponentIndices.map((opponentIndex) => _.get(conversionsByPlayerByOpening, [opponentIndex, "trade"]) || []),
  );

  const benefitsPlayer = [];

  // Figure out which punishes benefited this player
  const zippedTrades = _.zip(playerTrades, opponentTrades);
  zippedTrades.forEach((conversionPair) => {
    const playerConversion = _.first(conversionPair);
    const opponentConversion = _.last(conversionPair);
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

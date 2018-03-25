// @flow
import _ from 'lodash';
import SlippiGame from "../index";
import { getSinglesOpponentIndices, iterateFramesInOrder } from "./common";

import type { OverallType } from "./common";
import type { PostFrameUpdateType } from "../utils/slpReader";

export function generateOverall(game: SlippiGame): OverallType[] {
  const playerIndices = getSinglesOpponentIndices(game);

  const inputs = generateInputs(game);

  const inputsByPlayer = _.keyBy(inputs, 'playerIndex');
  const stocksByPlayer = _.groupBy(game.stats.stocks, 'playerIndex');
  const conversionsByPlayer = _.groupBy(game.stats.conversions, 'playerIndex');
  const conversionsByPlayerByOpening = _.map(conversionsByPlayer, (conversions) => {
    return _.groupBy(conversions, 'openingType');
  });

  const overall = _.map(playerIndices, (indices) => {
    const playerIndex = indices.playerIndex;
    const opponentIndex = indices.opponentIndex;

    const inputCount = _.get(inputsByPlayer, [playerIndex, 'count']) || 0;
    const conversions = _.get(conversionsByPlayer, playerIndex) || [];
    const successfulConversions = _.filter(conversions, (conversion) => (
      conversion.moves.length > 1
    ));
    const opponentStocks = _.get(stocksByPlayer, opponentIndex) || [];
    const opponentEndedStocks = _.filter(opponentStocks, 'endFrame');

    const conversionCount = conversions.length;
    const successfulConversionCount = successfulConversions.length;
    const totalDamage = _.sumBy(opponentStocks, 'currentPercent') || 0;
    const killCount = opponentEndedStocks.length;

    return {
      playerIndex: playerIndex,
      opponentIndex: opponentIndex,

      inputCount: inputCount,
      conversionCount: conversionCount,
      totalDamage: totalDamage,
      killCount: killCount,

      successfulConversions: getRatio(successfulConversionCount, conversionCount),
      inputsPerMinute: getRatio(inputCount, 0),
      openingsPerKill: getRatio(conversionCount, killCount),
      damagePerOpening: getRatio(totalDamage, conversionCount),
      neutralWinRatio: getOpeningRatio(
        conversionsByPlayerByOpening, playerIndex, opponentIndex, 'neutral-win'
      ),
      counterHitRatio: getOpeningRatio(
        conversionsByPlayerByOpening, playerIndex, opponentIndex, 'counter-attack'
      ),
      beneficialTradeRatio: getBeneficialTradeRatio(
        conversionsByPlayerByOpening, playerIndex, opponentIndex
      ),
    };
  });

  return overall;
}

function getRatio(count, total) {
  return {
    count: count,
    total: total,
    ratio: total ? count / total : null,
  };
}

function getOpeningRatio(conversionsByPlayerByOpening, playerIndex, opponentIndex, type) {
  const openings = _.get(
    conversionsByPlayerByOpening, [playerIndex, type]
  ) || [];

  const opponentOpenings = _.get(
    conversionsByPlayerByOpening, [opponentIndex, type]
  ) || [];

  return getRatio(openings.length, openings.length + opponentOpenings.length);
}

function getBeneficialTradeRatio(conversionsByPlayerByOpening, playerIndex, opponentIndex) {
  const playerTrades = _.get(
    conversionsByPlayerByOpening, [playerIndex, 'trade']
  ) || [];
  const opponentTrades = _.get(
    conversionsByPlayerByOpening, [opponentIndex, 'trade']
  ) || [];

  const benefitsPlayer = [];

  // Figure out which punishes benefited this player
  const zippedTrades = _.zip(playerTrades, opponentTrades);
  zippedTrades.forEach((conversionPair) => {
    const playerConversion = _.first(conversionPair);
    const opponentConversion = _.last(conversionPair);
    const playerDamage = playerConversion.currentPercent - playerConversion.startPercent;
    const opponentDamage = opponentConversion.currentPercent - opponentConversion.startPercent;

    if (playerConversion.didKill && !opponentConversion.didKill) {
      benefitsPlayer.push(playerConversion);
    } else if (playerDamage > opponentDamage) {
      benefitsPlayer.push(playerConversion);
    }
  });

  return getRatio(benefitsPlayer.length, playerTrades.length);
}

function generateInputs(game: SlippiGame) {

}

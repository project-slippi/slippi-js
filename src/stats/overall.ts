// @flow
import _ from 'lodash';
import { SlippiGame } from "../SlippiGame";
import { Frames, getSinglesOpponentIndices, iterateFramesInOrder, ConversionType, ConversionsByPlayerByOpening } from "./common";

import { OverallType } from "./common";
import { PreFrameUpdateType } from '../utils/slpReader';

enum JoystickRegion {
  DZ = 0,
  NE = 1,
  SE = 2,
  SW = 3,
  NW = 4,
  N = 5,
  E = 6,
  S = 7,
  W = 8,
};

export function generateOverall(game: SlippiGame): OverallType[] {
  const playerIndices = getSinglesOpponentIndices(game);

  const inputs = generateInputs(game);

  const inputsByPlayer = _.keyBy(inputs, 'playerIndex');
  const stocksByPlayer = _.groupBy(game.stats.stocks, 'playerIndex');
  const conversionsByPlayer = _.groupBy(game.stats.conversions, 'playerIndex');
  const conversionsByPlayerByOpening: ConversionsByPlayerByOpening = _.mapValues(conversionsByPlayer, (conversions) => (
    _.groupBy(conversions, 'openingType')
  ));

  const gameMinutes = game.stats.playableFrameCount / 3600;

  const overall = playerIndices.map(indices => {
    const playerIndex = indices.playerIndex;
    const opponentIndex = indices.opponentIndex;

    const inputCount = _.get(inputsByPlayer, [playerIndex, 'inputCount']) || 0;
    const conversions = _.get(conversionsByPlayer, playerIndex) || [];
    const successfulConversions = conversions.filter(conversion => conversion.moves.length > 1);
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
      inputsPerMinute: getRatio(inputCount, gameMinutes),
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

interface Ratio {
  count: number;
  total: number;
  ratio: number | null;
}

function getRatio(count: number, total: number): Ratio {
  return {
    count: count,
    total: total,
    ratio: total ? count / total : null,
  } as Ratio;
}

function getOpeningRatio(conversionsByPlayerByOpening: ConversionsByPlayerByOpening, playerIndex: number, opponentIndex: number, type: string): Ratio {
  const openings = _.get(
    conversionsByPlayerByOpening, [playerIndex, type]
  ) || [];

  const opponentOpenings = _.get(
    conversionsByPlayerByOpening, [opponentIndex, type]
  ) || [];

  return getRatio(openings.length, openings.length + opponentOpenings.length);
}

function getBeneficialTradeRatio(conversionsByPlayerByOpening: ConversionsByPlayerByOpening, playerIndex: number, opponentIndex: number): Ratio {
  const playerTrades = _.get(
    conversionsByPlayerByOpening, [playerIndex, 'trade']
  ) || [];
  const opponentTrades = _.get(
    conversionsByPlayerByOpening, [opponentIndex, 'trade']
  ) || [];

  const benefitsPlayer = [];

  // Figure out which punishes benefited this player
  const zippedTrades: [ConversionType, ConversionType][] = _.zip(playerTrades, opponentTrades);
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

interface PlayerInput {
  playerIndex: number;
  opponentIndex: number;
  inputCount: number;
}

function generateInputs(game: SlippiGame): Array<PlayerInput> {
  const inputs: Array<PlayerInput> = [];
  const frames = game.getFrames();

  let state: PlayerInput;

  // Iterates the frames in order in order to compute stocks
  iterateFramesInOrder(game, (indices) => {
    const playerInputs: PlayerInput = {
      playerIndex: indices.playerIndex,
      opponentIndex: indices.opponentIndex,
      inputCount: 0,
    };

    state = playerInputs;

    inputs.push(playerInputs);
  }, (indices, frame) => {
    const playerFrame: PreFrameUpdateType = frame.players[indices.playerIndex].pre;
    // FIXME: use PreFrameUpdateType instead of any
    // This is because the default value {} should not be casted as a type of PreFrameUpdateType
    const prevPlayerFrame: any = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.playerIndex, 'pre'], {}
    );

    if (playerFrame.frame < Frames.FIRST_PLAYABLE) {
      // Don't count inputs until the game actually starts
      return;
    }

    // First count the number of buttons that go from 0 to 1
    // Increment action count by amount of button presses
    const invertedPreviousButtons = ~prevPlayerFrame.physicalButtons;
    const currentButtons = playerFrame.physicalButtons;
    const buttonChanges = (invertedPreviousButtons & currentButtons) & 0xFFF;
    state.inputCount += countSetBits(buttonChanges);

    // Increment action count when sticks change from one region to another.
    // Don't increment when stick returns to deadzone
    const prevAnalogRegion = getJoystickRegion(
      prevPlayerFrame.joystickX, prevPlayerFrame.joystickY
    );
    const currentAnalogRegion = getJoystickRegion(
      playerFrame.joystickX, playerFrame.joystickY
    );
    if ((prevAnalogRegion !== currentAnalogRegion) && (currentAnalogRegion !== 0)) {
      state.inputCount += 1;
    }

    // Do the same for c-stick
    const prevCstickRegion = getJoystickRegion(prevPlayerFrame.cStickX, prevPlayerFrame.cStickY);
    const currentCstickRegion = getJoystickRegion(playerFrame.cStickX, playerFrame.cStickY);
    if ((prevCstickRegion !== currentCstickRegion) && (currentCstickRegion !== 0)) {
      state.inputCount += 1;
    }

    // Increment action on analog trigger... I'm not sure when. This needs revision
    // Currently will update input count when the button gets pressed past 0.3
    // Changes from hard shield to light shield should probably count as inputs but
    // are not counted here
    // FIXME: the lTrigger parameter does not exist on the PreFrameUpdateType
    if (prevPlayerFrame.lTrigger < 0.3 && (playerFrame as any).lTrigger >= 0.3) {
      state.inputCount += 1;
    }
    // FIXME: the rTrigger parameter does not exist on the PreFrameUpdateType
    if (prevPlayerFrame.rTrigger < 0.3 && (playerFrame as any).rTrigger >= 0.3) {
      state.inputCount += 1;
    }
  });

  return inputs;
}

function countSetBits(x: number): number {
  // This function solves the Hamming Weight problem. Effectively it counts the number of
  // bits in the input that are set to 1
  // This implementation is supposedly very efficient when most bits are zero.
  // Found: https://en.wikipedia.org/wiki/Hamming_weight#Efficient_implementation
  let bits = x;

  let count;
  for (count = 0; bits; count += 1) {
    bits &= bits - 1;
  }
  return count;
}

function getJoystickRegion(x: number, y: number): JoystickRegion {
  let region = JoystickRegion.DZ;

  if (x >= 0.2875 && y >= 0.2875) {
    region = JoystickRegion.NE;
  } else if (x >= 0.2875 && y <= -0.2875) {
    region = JoystickRegion.SE;
  } else if (x <= -0.2875 && y <= -0.2875) {
    region = JoystickRegion.SW;
  } else if (x <= -0.2875 && y >= 0.2875) {
    region = JoystickRegion.NW;
  } else if (y >= 0.2875) {
    region = JoystickRegion.N;
  } else if (x >= 0.2875) {
    region = JoystickRegion.E;
  } else if (y <= -0.2875) {
    region = JoystickRegion.S;
  } else if (x <= -0.2875) {
    region = JoystickRegion.W;
  }

  return region;
}

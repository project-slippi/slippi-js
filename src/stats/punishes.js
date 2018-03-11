// @flow
import _ from 'lodash';
import SlippiGame from "../index";
import type { PostFrameUpdateType } from "../utils/slpReader";
import type { MoveLandedType, PunishType } from "./common";
import {
  iterateFramesInOrder, isDamaged, isGrabbed, calcDamageTaken, isInControl, didLoseStock,
  Timers
} from "./common";

export function generatePunishes(game: SlippiGame): PunishType[] {
  // TODO: Perhaps call punishes "conversions"?
  const punishes = [];
  const frames = game.getFrames();

  const initialState: {
    punish: PunishType | null,
    move: MoveLandedType | null,
    resetCounter: number,
    lastHitAnimation: number | null,
  } = {
    punish: null,
    move: null,
    resetCounter: 0,
    lastHitAnimation: null,
  };

  // Only really doing assignment here for flow
  let state = initialState;

  // Iterates the frames in order in order to compute punishes
  iterateFramesInOrder(game, () => {
    state = { ...initialState };
  }, (indices, frame) => {
    const playerFrame: PostFrameUpdateType = frame.players[indices.playerIndex].post;
    const prevPlayerFrame: PostFrameUpdateType = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.playerIndex, 'post'], {}
    );
    const opponentFrame: PostFrameUpdateType = frame.players[indices.opponentIndex].post;
    const prevOpponentFrame: PostFrameUpdateType = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.opponentIndex, 'post'], {}
    );

    const opntIsDamaged = isDamaged(opponentFrame.actionStateId);
    const opntIsGrabbed = isGrabbed(opponentFrame.actionStateId);
    const opntDamageTaken = calcDamageTaken(opponentFrame, prevOpponentFrame);

    // Keep track of whether actionState changes after a hit. Used to computer move count
    if (playerFrame.actionStateId !== state.lastHitAnimation) {
      state.lastHitAnimation = null;
    }

    // If opponent took damage and was put in some kind of stun this frame, either
    // start a punish or
    if (opntDamageTaken && (opntIsDamaged || opntIsGrabbed)) {
      if (!state.punish) {
        state.punish = {
          playerIndex: indices.playerIndex,
          opponentIndex: indices.opponentIndex,
          startFrame: playerFrame.frame,
          endFrame: null,
          startPercent: prevOpponentFrame.percent || 0,
          currentPercent: opponentFrame.percent || 0,
          endPercent: null,
          moves: [],
          didKill: false,
          openingType: "unknown", // Will be updated later
        };

        punishes.push(state.punish);
      }

      // If animation of last hit has been cleared that means this is a new move. This
      // prevents counting multiple hits from the same move such as fox's drill
      if (!state.lastHitAnimation) {
        state.move = {
          frame: playerFrame.frame,
          moveId: playerFrame.lastAttackLanded,
          hitCount: 0,
        };

        state.punish.moves.push(state.move);
      }

      if (state.move) {
        state.move.hitCount += 1;
      }

      // Store previous frame animation to consider the case of a trade, the previous
      // frame should always be the move that actually connected... I hope
      state.lastHitAnimation = prevPlayerFrame.actionStateId;
    }

    if (!state.punish) {
      // The rest of the function handles punish termination logic, so if we don't
      // have a punish started, there is no need to continue
      return;
    }

    const opntInControl = isInControl(opponentFrame.actionStateId);
    const opntDidLoseStock = didLoseStock(opponentFrame, prevOpponentFrame);

    // Update percent if opponent didn't lose stock
    if (!opntDidLoseStock) {
      state.punish.currentPercent = opponentFrame.percent || 0;
    }

    if (opntIsDamaged || opntIsGrabbed) {
      // If opponent got grabbed or damaged, reset the reset counter
      state.resetCounter = 0;
    }

    const shouldStartResetCounter = state.resetCounter === 0 && opntInControl;
    const shouldContinueResetCounter = state.resetCounter > 0;
    if (shouldStartResetCounter || shouldContinueResetCounter) {
      // This will increment the reset timer under the following conditions:
      // 1) if we were punishing opponent but they have now entered an actionable state
      // 2) if counter has already started counting meaning opponent has entered actionable state
      state.resetCounter += 1;
    }

    let shouldTerminate = false;

    // Termination condition 1 - player kills opponent
    if (opntDidLoseStock) {
      state.punish.didKill = true;
      shouldTerminate = true;
    }

    // Termination condition 2 - punish resets on time
    if (state.resetCounter > Timers.PUNISH_RESET_FRAMES) {
      shouldTerminate = true;
    }

    // If punish should terminate, mark the end states and add it to list
    if (shouldTerminate) {
      state.punish.endFrame = playerFrame.frame;
      state.punish.endPercent = prevOpponentFrame.percent || 0;

      state.punish = null;
      state.move = null;
    }
  });

  // Adds opening type to the punishes
  addOpeningTypeToPunishes(game, punishes);

  return punishes;
}

function addOpeningTypeToPunishes(game, punishes) {
  const punishesByPlayerIndex = _.groupBy(punishes, 'playerIndex');
  const keyedPunishes = _.mapValues(punishesByPlayerIndex, (playerPunishes) => (
    _.keyBy(playerPunishes, 'startFrame')
  ));

  const initialState: {
    opponentPunish: PunishType | null,
  } = {
    opponentPunish: null
  };

  // Only really doing assignment here for flow
  let state = initialState;

  // console.log(punishesByPlayerIndex);

  // Iterates the frames in order in order to compute punishes
  iterateFramesInOrder(game, () => {
    state = { ...initialState };
  }, (indices, frame) => {
    const frameNum = frame.frame;

    // Clear opponent punish if it ended this frame
    if (_.get(state, ['opponentPunish', 'endFrame']) === frameNum) {
      state.opponentPunish = null;
    }

    // Get opponent punish. Add to state if exists for this frame
    const opponentPunish = _.get(keyedPunishes, [indices.opponentIndex, frameNum]);
    if (opponentPunish) {
      state.opponentPunish = opponentPunish;
    }

    const playerPunish = _.get(keyedPunishes, [indices.playerIndex, frameNum]);
    if (!playerPunish) {
      // Only need to do something if a punish for this player started on this frame
      return;
    }

    // In the case where punishes from both players start on the same frame, set trade
    if (playerPunish && opponentPunish) {
      playerPunish.openingType = "trade";
      return;
    }

    // TODO: Handle this in a better way. It probably shouldn't be considered a neutral
    // TODO: win in the case where a player attacks into a crouch cancel and gets
    // TODO: countered on.
    // TODO: Also perhaps if a player gets a random hit in the middle of a the other
    // TODO: player's combo it shouldn't be called a counter-attack

    // If opponent has an active punish, this is a counter-attack, otherwise a neutral win
    playerPunish.openingType = state.opponentPunish ? "counter-attack" : "neutral-win";
  });
}

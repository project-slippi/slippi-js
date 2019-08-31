import * as _ from 'lodash';
import SlippiGame from "../index";
import { PostFrameUpdateType } from "../utils/slpReader";
import { MoveLandedType, ComboType } from "./common";
import {
  iterateFramesInOrder, isDamaged, isGrabbed, calcDamageTaken, isTeching, didLoseStock,
  Timers, isDown, isDead
} from "./common";

export function generateCombos(game: SlippiGame): Array<ComboType> {
  const combos: Array<ComboType> = [];
  const frames = game.getFrames();

  const initialState: {
    combo: ComboType | null;
    move: MoveLandedType | null;
    resetCounter: number;
    lastHitAnimation: number | null;
  } = {
    combo: null,
    move: null,
    resetCounter: 0,
    lastHitAnimation: null,
  };

  // Only really doing assignment here for flow
  let state = initialState;

  // Iterates the frames in order in order to compute combos
  iterateFramesInOrder(game, () => {
    state = { ...initialState };
  }, (indices, frame) => {
    const playerFrame: PostFrameUpdateType = frame.players[indices.playerIndex].post;
    // FIXME: use type PostFrameUpdateType instead of any
    const prevPlayerFrame: any = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.playerIndex, 'post'], {}
    );
    const opponentFrame: PostFrameUpdateType = frame.players[indices.opponentIndex].post;
    // FIXME: use type PostFrameUpdateType instead of any
    const prevOpponentFrame: any = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.opponentIndex, 'post'], {}
    );

    const opntIsDamaged = isDamaged(opponentFrame.actionStateId);
    const opntIsGrabbed = isGrabbed(opponentFrame.actionStateId);
    const opntDamageTaken = calcDamageTaken(opponentFrame, prevOpponentFrame);

    // Keep track of whether actionState changes after a hit. Used to compute move count
    // When purely using action state there was a bug where if you did two of the same
    // move really fast (such as ganon's jab), it would count as one move. Added
    // the actionStateCounter at this point which counts the number of frames since
    // an animation started. Should be more robust, for old files it should always be
    // null and null < null = false
    const actionChangedSinceHit = playerFrame.actionStateId !== state.lastHitAnimation;
    const actionCounter = playerFrame.actionStateCounter;
    const prevActionCounter = prevPlayerFrame.actionStateCounter;
    const actionFrameCounterReset = actionCounter < prevActionCounter;
    if (actionChangedSinceHit || actionFrameCounterReset) {
      state.lastHitAnimation = null;
    }

    // If opponent took damage and was put in some kind of stun this frame, either
    // start a combo or count the moves for the existing combo
    if (opntIsDamaged || opntIsGrabbed) {
      if (!state.combo) {
        state.combo = {
          playerIndex: indices.playerIndex,
          opponentIndex: indices.opponentIndex,
          startFrame: playerFrame.frame,
          endFrame: null,
          startPercent: prevOpponentFrame.percent || 0,
          currentPercent: opponentFrame.percent || 0,
          endPercent: null,
          moves: [],
          didKill: false,
        };

        combos.push(state.combo);
      }

      if (opntDamageTaken) {
        // If animation of last hit has been cleared that means this is a new move. This
        // prevents counting multiple hits from the same move such as fox's drill
        if (!state.lastHitAnimation) {
          state.move = {
            frame: playerFrame.frame,
            moveId: playerFrame.lastAttackLanded,
            hitCount: 0,
            damage: 0,
          };

          state.combo.moves.push(state.move);
        }

        if (state.move) {
          state.move.hitCount += 1;
          state.move.damage += opntDamageTaken;
        }

        // Store previous frame animation to consider the case of a trade, the previous
        // frame should always be the move that actually connected... I hope
        state.lastHitAnimation = prevPlayerFrame.actionStateId;
      }
    }

    if (!state.combo) {
      // The rest of the function handles combo termination logic, so if we don't
      // have a combo started, there is no need to continue
      return;
    }

    const opntIsTeching = isTeching(opponentFrame.actionStateId);
    const opntIsDowned = isDown(opponentFrame.actionStateId);
    const opntDidLoseStock = didLoseStock(opponentFrame, prevOpponentFrame);
    const opntIsDying = isDead(opponentFrame.actionStateId);

    // Update percent if opponent didn't lose stock
    if (!opntDidLoseStock) {
      state.combo.currentPercent = opponentFrame.percent || 0;
    }

    if (opntIsDamaged || opntIsGrabbed || opntIsTeching || opntIsDowned || opntIsDying) {
      // If opponent got grabbed or damaged, reset the reset counter
      state.resetCounter = 0;
    } else {
      state.resetCounter += 1;
    }

    let shouldTerminate = false;

    // Termination condition 1 - player kills opponent
    if (opntDidLoseStock) {
      state.combo.didKill = true;
      shouldTerminate = true;
    }

    // Termination condition 2 - combo resets on time
    if (state.resetCounter > Timers.COMBO_STRING_RESET_FRAMES) {
      shouldTerminate = true;
    }

    // If combo should terminate, mark the end states and add it to list
    if (shouldTerminate) {
      state.combo.endFrame = playerFrame.frame;
      state.combo.endPercent = prevOpponentFrame.percent || 0;

      state.combo = null;
      state.move = null;
    }
  });

  return combos;
}

import { EventEmitter } from "events";
import last from "lodash/last";

import type { FrameEntryType, FramesType, GameStartType, PostFrameUpdateType } from "../types";
import type { ComboType, MoveLandedType, PlayerIndexedType } from "./common";
import {
  calcDamageTaken,
  didLoseStock,
  getSinglesPlayerPermutationsFromSettings,
  isCommandGrabbed,
  isDamaged,
  isDead,
  isDown,
  isGrabbed,
  isTeching,
  Timers,
} from "./common";
import type { StatComputer } from "./stats";

export enum ComboEvent {
  COMBO_START = "COMBO_START",
  COMBO_EXTEND = "COMBO_EXTEND",
  COMBO_END = "COMBO_END",
}

type ComboState = {
  combo: ComboType | null;
  move: MoveLandedType | null;
  resetCounter: number;
  lastHitAnimation: number | null;
  event: ComboEvent | null;
};

export class ComboComputer extends EventEmitter implements StatComputer<ComboType[]> {
  private playerPermutations = new Array<PlayerIndexedType>();
  private state = new Map<PlayerIndexedType, ComboState>();
  private combos = new Array<ComboType>();
  private settings: GameStartType | null = null;

  public setup(settings: GameStartType): void {
    // Reset the state
    this.settings = settings;
    this.state = new Map();
    this.combos = [];
    this.playerPermutations = getSinglesPlayerPermutationsFromSettings(settings);

    this.playerPermutations.forEach((indices) => {
      const playerState: ComboState = {
        combo: null,
        move: null,
        resetCounter: 0,
        lastHitAnimation: null,
        event: null,
      };
      this.state.set(indices, playerState);
    });
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    this.playerPermutations.forEach((indices) => {
      const state = this.state.get(indices);
      if (state) {
        handleComboCompute(allFrames, state, indices, frame, this.combos);

        // Emit an event for the new combo
        if (state.event !== null) {
          this.emit(state.event, {
            combo: last(this.combos),
            settings: this.settings,
          });
          state.event = null;
        }
      }
    });
  }

  public fetch(): ComboType[] {
    return this.combos;
  }
}

function handleComboCompute(
  frames: FramesType,
  state: ComboState,
  indices: PlayerIndexedType,
  frame: FrameEntryType,
  combos: ComboType[],
): void {
  const currentFrameNumber = frame.frame;
  const playerFrame = frame.players[indices.playerIndex]!.post;
  const opponentFrame = frame.players[indices.opponentIndex]!.post;

  const prevFrameNumber = currentFrameNumber - 1;
  let prevPlayerFrame: PostFrameUpdateType | null = null;
  let prevOpponentFrame: PostFrameUpdateType | null = null;

  if (frames[prevFrameNumber]) {
    prevPlayerFrame = frames[prevFrameNumber]!.players[indices.playerIndex]!.post;
    prevOpponentFrame = frames[prevFrameNumber]!.players[indices.opponentIndex]!.post;
  }

  const oppActionStateId = opponentFrame.actionStateId!;
  const opntIsDamaged = isDamaged(oppActionStateId);
  const opntIsGrabbed = isGrabbed(oppActionStateId);
  const opntIsCommandGrabbed = isCommandGrabbed(oppActionStateId);
  const opntDamageTaken = prevOpponentFrame ? calcDamageTaken(opponentFrame, prevOpponentFrame) : 0;

  // Keep track of whether actionState changes after a hit. Used to compute move count
  // When purely using action state there was a bug where if you did two of the same
  // move really fast (such as ganon's jab), it would count as one move. Added
  // the actionStateCounter at this point which counts the number of frames since
  // an animation started. Should be more robust, for old files it should always be
  // null and null < null = false
  const actionChangedSinceHit = playerFrame.actionStateId !== state.lastHitAnimation;
  const actionCounter = playerFrame.actionStateCounter!;
  const prevActionCounter = prevPlayerFrame ? prevPlayerFrame.actionStateCounter! : 0;
  const actionFrameCounterReset = actionCounter < prevActionCounter;
  if (actionChangedSinceHit || actionFrameCounterReset) {
    state.lastHitAnimation = null;
  }

  // If opponent took damage and was put in some kind of stun this frame, either
  // start a combo or count the moves for the existing combo
  if (opntIsDamaged || opntIsGrabbed || opntIsCommandGrabbed) {
    let comboStarted = false;
    if (!state.combo) {
      state.combo = {
        playerIndex: indices.opponentIndex,
        startFrame: currentFrameNumber,
        endFrame: null,
        startPercent: prevOpponentFrame ? prevOpponentFrame.percent ?? 0 : 0,
        currentPercent: opponentFrame.percent ?? 0,
        endPercent: null,
        moves: [],
        didKill: false,
        lastHitBy: indices.playerIndex,
      };

      combos.push(state.combo);

      // Track whether this is a new combo or not
      comboStarted = true;
    }

    if (opntDamageTaken) {
      // If animation of last hit has been cleared that means this is a new move. This
      // prevents counting multiple hits from the same move such as fox's drill
      if (state.lastHitAnimation === null) {
        state.move = {
          playerIndex: indices.playerIndex,
          frame: currentFrameNumber,
          moveId: playerFrame.lastAttackLanded!,
          hitCount: 0,
          damage: 0,
        };

        state.combo.moves.push(state.move);

        // Make sure we don't overwrite the START event
        if (!comboStarted) {
          state.event = ComboEvent.COMBO_EXTEND;
        }
      }

      if (state.move) {
        state.move.hitCount += 1;
        state.move.damage += opntDamageTaken;
      }

      // Store previous frame animation to consider the case of a trade, the previous
      // frame should always be the move that actually connected... I hope
      state.lastHitAnimation = prevPlayerFrame ? prevPlayerFrame.actionStateId : null;
    }

    if (comboStarted) {
      state.event = ComboEvent.COMBO_START;
    }
  }

  if (!state.combo) {
    // The rest of the function handles combo termination logic, so if we don't
    // have a combo started, there is no need to continue
    return;
  }

  const opntIsTeching = isTeching(oppActionStateId);
  const opntIsDowned = isDown(oppActionStateId);
  const opntDidLoseStock = prevOpponentFrame && didLoseStock(opponentFrame, prevOpponentFrame);
  const opntIsDying = isDead(oppActionStateId);

  // Update percent if opponent didn't lose stock
  if (!opntDidLoseStock) {
    state.combo.currentPercent = opponentFrame.percent ?? 0;
  }

  if (opntIsDamaged || opntIsGrabbed || opntIsCommandGrabbed || opntIsTeching || opntIsDowned || opntIsDying) {
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
    state.combo.endPercent = prevOpponentFrame ? prevOpponentFrame.percent ?? 0 : 0;
    state.event = ComboEvent.COMBO_END;

    state.combo = null;
    state.move = null;
  }
}

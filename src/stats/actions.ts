import get from "lodash/get";
import isEqual from "lodash/isEqual";
import keyBy from "lodash/keyBy";
import last from "lodash/last";
import set from "lodash/set";
import size from "lodash/size";

import type { FrameEntryType, GameStartType } from "../types";
import type { ActionCountsType, PlayerIndexedType } from "./common";
import { getSinglesPlayerPermutationsFromSettings, State } from "./common";
import type { StatComputer } from "./stats";

// Frame pattern that indicates a dash dance turn was executed
const dashDanceAnimations = [State.DASH, State.TURN, State.DASH];

type PlayerActionState = {
  playerCounts: ActionCountsType;
  animations: number[];
  actionFrameCounters: number[];
};

export class ActionsComputer implements StatComputer<ActionCountsType[]> {
  private playerPermutations = new Array<PlayerIndexedType>();
  private state = new Map<PlayerIndexedType, PlayerActionState>();

  public setup(settings: GameStartType): void {
    this.state = new Map();
    this.playerPermutations = getSinglesPlayerPermutationsFromSettings(settings);
    this.playerPermutations.forEach((indices) => {
      const playerCounts: ActionCountsType = {
        playerIndex: indices.playerIndex,
        wavedashCount: 0,
        wavelandCount: 0,
        airDodgeCount: 0,
        dashDanceCount: 0,
        spotDodgeCount: 0,
        ledgegrabCount: 0,
        rollCount: 0,
        lCancelCount: {
          success: 0,
          fail: 0,
        },
        attackCount: {
          jab1: 0,
          jab2: 0,
          jab3: 0,
          jabm: 0,
          dash: 0,
          ftilt: 0,
          utilt: 0,
          dtilt: 0,
          fsmash: 0,
          usmash: 0,
          dsmash: 0,
          nair: 0,
          fair: 0,
          bair: 0,
          uair: 0,
          dair: 0,
        },
        grabCount: {
          success: 0,
          fail: 0,
        },
        throwCount: {
          up: 0,
          forward: 0,
          back: 0,
          down: 0,
        },
        groundTechCount: {
          // tech away/in are in reference to the opponents position and not the stage
          away: 0,
          in: 0,
          neutral: 0,
          fail: 0,
        },
        wallTechCount: {
          success: 0,
          fail: 0,
        },
      };
      const playerState: PlayerActionState = {
        playerCounts: playerCounts,
        animations: [],
        actionFrameCounters: [],
      };
      this.state.set(indices, playerState);
    });
  }

  public processFrame(frame: FrameEntryType): void {
    this.playerPermutations.forEach((indices) => {
      const state = this.state.get(indices);
      if (state) {
        handleActionCompute(state, indices, frame);
      }
    });
  }

  public fetch(): ActionCountsType[] {
    return Array.from(this.state.values()).map((val) => val.playerCounts);
  }
}

function isMissGroundTech(animation: State): boolean {
  return animation === State.TECH_MISS_DOWN || animation === State.TECH_MISS_UP;
}

function isRolling(animation: State): boolean {
  return animation === State.ROLL_BACKWARD || animation === State.ROLL_FORWARD;
}

function isGrabAction(animation: State): boolean {
  // Includes Grab pull, wait, pummel, and throws
  return animation > State.GRAB && animation <= State.THROW_DOWN && animation !== State.DASH_GRAB;
}

function isGrabbing(animation: State): boolean {
  return animation === State.GRAB || animation === State.DASH_GRAB;
}

function isAerialAttack(animation: State): boolean {
  return animation >= State.AERIAL_ATTACK_START && animation <= State.AERIAL_ATTACK_END;
}

function isForwardTilt(animation: State): boolean {
  return animation >= State.ATTACK_FTILT_START && animation <= State.ATTACK_FTILT_END;
}

function isForwardSmash(animation: State): boolean {
  return animation >= State.ATTACK_FSMASH_START && animation <= State.ATTACK_FSMASH_END;
}

function handleActionCompute(state: PlayerActionState, indices: PlayerIndexedType, frame: FrameEntryType): void {
  const playerFrame = frame.players[indices.playerIndex]!.post;
  const opponentFrame = frame.players[indices.opponentIndex]!.post;
  const incrementCount = (field: string, condition: boolean): void => {
    if (!condition) {
      return;
    }

    const current: number = get(state.playerCounts, field, 0);
    set(state.playerCounts, field, current + 1);
  };

  // Manage animation state
  const currentAnimation = playerFrame.actionStateId!;
  state.animations.push(currentAnimation);
  const currentFrameCounter = playerFrame.actionStateCounter!;
  state.actionFrameCounters.push(currentFrameCounter);

  // Grab last 3 frames
  const last3Frames = state.animations.slice(-3);
  const prevAnimation = last3Frames[last3Frames.length - 2] as number;
  const prevFrameCounter = state.actionFrameCounters[state.actionFrameCounters.length - 2] as number;

  // New action if new animation or frame counter goes back down (repeated action)
  const isNewAction = currentAnimation !== prevAnimation || prevFrameCounter > currentFrameCounter;
  if (!isNewAction) {
    return;
  }

  // Increment counts based on conditions
  const didDashDance = isEqual(last3Frames, dashDanceAnimations);
  incrementCount("dashDanceCount", didDashDance);

  incrementCount("rollCount", isRolling(currentAnimation));
  incrementCount("spotDodgeCount", currentAnimation === State.SPOT_DODGE);
  incrementCount("airDodgeCount", currentAnimation === State.AIR_DODGE);
  incrementCount("ledgegrabCount", currentAnimation === State.CLIFF_CATCH);

  // Grabs
  incrementCount("grabCount.success", isGrabbing(prevAnimation) && isGrabAction(currentAnimation));
  incrementCount("grabCount.fail", isGrabbing(prevAnimation) && !isGrabAction(currentAnimation));
  if (currentAnimation === State.DASH_GRAB && prevAnimation === State.ATTACK_DASH) {
    state.playerCounts.attackCount.dash -= 1; // subtract from dash attack if boost grab
  }

  // Basic attacks
  incrementCount("attackCount.jab1", currentAnimation === State.ATTACK_JAB1);
  incrementCount("attackCount.jab2", currentAnimation === State.ATTACK_JAB2);
  incrementCount("attackCount.jab3", currentAnimation === State.ATTACK_JAB3);
  incrementCount("attackCount.jabm", currentAnimation === State.ATTACK_JABM);
  incrementCount("attackCount.dash", currentAnimation === State.ATTACK_DASH);
  incrementCount("attackCount.ftilt", isForwardTilt(currentAnimation));
  incrementCount("attackCount.utilt", currentAnimation === State.ATTACK_UTILT);
  incrementCount("attackCount.dtilt", currentAnimation === State.ATTACK_DTILT);
  incrementCount("attackCount.fsmash", isForwardSmash(currentAnimation));
  incrementCount("attackCount.usmash", currentAnimation === State.ATTACK_USMASH);
  incrementCount("attackCount.dsmash", currentAnimation === State.ATTACK_DSMASH);
  incrementCount("attackCount.nair", currentAnimation === State.AERIAL_NAIR);
  incrementCount("attackCount.fair", currentAnimation === State.AERIAL_FAIR);
  incrementCount("attackCount.bair", currentAnimation === State.AERIAL_BAIR);
  incrementCount("attackCount.uair", currentAnimation === State.AERIAL_UAIR);
  incrementCount("attackCount.dair", currentAnimation === State.AERIAL_DAIR);

  // GnW is weird and has unique IDs for some moves
  if (playerFrame.internalCharacterId === 0x18) {
    incrementCount("attackCount.jab1", currentAnimation === State.GNW_JAB1);
    incrementCount("attackCount.jabm", currentAnimation === State.GNW_JABM);
    incrementCount("attackCount.dtilt", currentAnimation === State.GNW_DTILT);
    incrementCount("attackCount.fsmash", currentAnimation === State.GNW_FSMASH);
    incrementCount("attackCount.nair", currentAnimation === State.GNW_NAIR);
    incrementCount("attackCount.bair", currentAnimation === State.GNW_BAIR);
    incrementCount("attackCount.uair", currentAnimation === State.GNW_UAIR);
  }

  // Peach is also weird and has a unique ID for her fsmash
  // FSMASH1 = Golf Club, FSMASH2 = Frying Pan, FSMASH3 = Tennis Racket
  if (playerFrame.internalCharacterId === 0x09) {
    incrementCount("attackCount.fsmash", currentAnimation === State.PEACH_FSMASH1);
    incrementCount("attackCount.fsmash", currentAnimation === State.PEACH_FSMASH2);
    incrementCount("attackCount.fsmash", currentAnimation === State.PEACH_FSMASH3);
  }

  // Throws
  incrementCount("throwCount.up", currentAnimation === State.THROW_UP);
  incrementCount("throwCount.forward", currentAnimation === State.THROW_FORWARD);
  incrementCount("throwCount.down", currentAnimation === State.THROW_DOWN);
  incrementCount("throwCount.back", currentAnimation === State.THROW_BACK);

  // Techs
  const opponentDir = playerFrame.positionX! > opponentFrame.positionX! ? -1 : 1;
  const facingOpponent = playerFrame.facingDirection === opponentDir;

  incrementCount("groundTechCount.fail", isMissGroundTech(currentAnimation));
  incrementCount("groundTechCount.in", currentAnimation === State.FORWARD_TECH && facingOpponent);
  incrementCount("groundTechCount.in", currentAnimation === State.BACKWARD_TECH && !facingOpponent);
  incrementCount("groundTechCount.neutral", currentAnimation === State.NEUTRAL_TECH);
  incrementCount("groundTechCount.away", currentAnimation === State.BACKWARD_TECH && facingOpponent);
  incrementCount("groundTechCount.away", currentAnimation === State.FORWARD_TECH && !facingOpponent);
  incrementCount("wallTechCount.success", currentAnimation === State.WALL_TECH);
  incrementCount("wallTechCount.fail", currentAnimation === State.MISSED_WALL_TECH);

  if (isAerialAttack(currentAnimation)) {
    incrementCount("lCancelCount.success", playerFrame.lCancelStatus === 1);
    incrementCount("lCancelCount.fail", playerFrame.lCancelStatus === 2);
  }

  // Handles wavedash detection (and waveland)
  handleActionWavedash(state.playerCounts, state.animations);
}

function handleActionWavedash(counts: ActionCountsType, animations: State[]): void {
  const currentAnimation = last(animations);
  const prevAnimation = animations[animations.length - 2] as number;

  const isSpecialLanding = currentAnimation === State.LANDING_FALL_SPECIAL;
  const isAcceptablePrevious = isWavedashInitiationAnimation(prevAnimation);
  const isPossibleWavedash = isSpecialLanding && isAcceptablePrevious;

  if (!isPossibleWavedash) {
    return;
  }

  // Here we special landed, it might be a wavedash, let's check
  // We grab the last 8 frames here because that should be enough time to execute a
  // wavedash. This number could be tweaked if we find false negatives
  const recentFrames = animations.slice(-8);
  const recentAnimations = keyBy(recentFrames, (animation) => animation);

  if (size(recentAnimations) === 2 && recentAnimations[State.AIR_DODGE]) {
    // If the only other animation is air dodge, this might be really late to the point
    // where it was actually an air dodge. Air dodge animation is really long
    return;
  }

  if (recentAnimations[State.AIR_DODGE]) {
    // If one of the recent animations was an air dodge, let's remove that from the
    // air dodge counter, we don't want to count air dodges used to wavedash/land
    counts.airDodgeCount -= 1;
  }

  if (recentAnimations[State.ACTION_KNEE_BEND]) {
    // If a jump was started recently, we will consider this a wavedash
    counts.wavedashCount += 1;
  } else {
    // If there was no jump recently, this is a waveland
    counts.wavelandCount += 1;
  }
}

function isWavedashInitiationAnimation(animation: State): boolean {
  if (animation === State.AIR_DODGE) {
    return true;
  }

  const isAboveMin = animation >= State.CONTROLLED_JUMP_START;
  const isBelowMax = animation <= State.CONTROLLED_JUMP_END;
  return isAboveMin && isBelowMax;
}

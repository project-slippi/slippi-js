import _ from 'lodash';
import { PostFrameUpdateType } from "../utils/slpReader";
import { SlippiGame, FrameEntryType } from '../SlippiGame';

type RatioType = {
  count: number;
  total: number;
  ratio: number | null;
};

type PlayerIndexedType = {
  playerIndex: number;
  opponentIndex: number;
};

export type DurationType = {
  startFrame: number;
  endFrame: number | null | undefined;
};

export type DamageType = {
  startPercent: number;
  currentPercent: number;
  endPercent: number | null | undefined;
};

export type StockType = PlayerIndexedType & DurationType & DamageType & {
  count: number;
  deathAnimation: number | null | undefined;
};

export type MoveLandedType = {
  frame: number;
  moveId: number;
  hitCount: number;
  damage: number;
};

export type ConversionType = PlayerIndexedType & DurationType & DamageType & {
  moves: MoveLandedType[];
  openingType: string;
  didKill: boolean;
};

export type ComboType = PlayerIndexedType & DurationType & DamageType & {
  moves: MoveLandedType[];
  didKill: boolean;
};

export type ActionCountsType = PlayerIndexedType & {
  wavedashCount: number;
  wavelandCount: number;
  airDodgeCount: number;
  dashDanceCount: number;
  spotDodgeCount: number;
  rollCount: number;
};

export type OverallType = PlayerIndexedType & {
  inputCount: number;
  conversionCount: number;
  totalDamage: number;
  killCount: number;
  successfulConversions: RatioType;
  inputsPerMinute: RatioType;
  openingsPerKill: RatioType;
  damagePerOpening: RatioType;
  neutralWinRatio: RatioType;
  counterHitRatio: RatioType;
  beneficialTradeRatio: RatioType;
};

export enum State {
  // Animation ID ranges
  DAMAGE_START = 0x4B,
  DAMAGE_END = 0x5B,
  CAPTURE_START = 0xDF,
  CAPTURE_END = 0xE8,
  GUARD_START = 0xB2,
  GUARD_END = 0xB6,
  GROUNDED_CONTROL_START = 0xE,
  GROUNDED_CONTROL_END = 0x18,
  SQUAT_START = 0x27,
  SQUAT_END = 0x29,
  DOWN_START = 0xB7,
  DOWN_END = 0xC6,
  TECH_START = 0xC7,
  TECH_END = 0xCC,
  DYING_START = 0x0,
  DYING_END = 0xA,
  CONTROLLED_JUMP_START = 0x18,
  CONTROLLED_JUMP_END = 0x22,
  GROUND_ATTACK_START = 0x2C,
  GROUND_ATTACK_END = 0x40,

  // Animation ID specific
  ROLL_FORWARD = 0xE9,
  ROLL_BACKWARD = 0xEA,
  SPOT_DODGE = 0xEB,
  AIR_DODGE = 0xEC,
  ACTION_WAIT = 0xE,
  ACTION_DASH = 0x14,
  ACTION_KNEE_BEND = 0x18,
  GUARD_ON = 0xB2,
  TECH_MISS_UP = 0xB7,
  TECH_MISS_DOWN = 0xBF,
  DASH = 0x14,
  TURN = 0x12,
  LANDING_FALL_SPECIAL = 0x2B,
  JUMP_FORWARD = 0x19,
  JUMP_BACKWARD = 0x1A,
  FALL_FORWARD = 0x1E,
  FALL_BACKWARD = 0x1F,
  GRAB = 0xD4,
};

export const Timers = {
  PUNISH_RESET_FRAMES: 45,
  RECOVERY_RESET_FRAMES: 45,
  COMBO_STRING_RESET_FRAMES: 45,
};

export const Frames = {
  FIRST: -123,
  FIRST_PLAYABLE: -39,
};

export function getSinglesOpponentIndices(game: SlippiGame): PlayerIndexedType[] {
  const settings = game.getSettings();
  if (!settings || settings.players.length !== 2) {
    // Only return opponent indices for singles
    return [];
  }

  return [
    {
      playerIndex: settings.players[0].playerIndex,
      opponentIndex: settings.players[1].playerIndex
    }, {
      playerIndex: settings.players[1].playerIndex,
      opponentIndex: settings.players[0].playerIndex
    }
  ];
}

export function didLoseStock(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): boolean {
  if (!frame || !prevFrame) {
    return false;
  }

  return (prevFrame.stocksRemaining - frame.stocksRemaining) > 0;
}

export function isInControl(state: number): boolean {
  const ground = state >= State.GROUNDED_CONTROL_START && state <= State.GROUNDED_CONTROL_END;
  const squat = state >= State.SQUAT_START && state <= State.SQUAT_END;
  const groundAttack = state > State.GROUND_ATTACK_START && state <= State.GROUND_ATTACK_END;
  const isGrab = state === State.GRAB;
  // TODO: Add grounded b moves?
  return ground || squat || groundAttack || isGrab;
}

export function isTeching(state: number): boolean {
  return state >= State.TECH_START && state <= State.TECH_END;
}

export function isDown(state: number): boolean {
  return state >= State.DOWN_START && state <= State.DOWN_END;
}

export function isDamaged(state: number): boolean {
  return state >= State.DAMAGE_START && state <= State.DAMAGE_END;
}

export function isGrabbed(state: number): boolean {
  return state >= State.CAPTURE_START && state <= State.CAPTURE_END;
}

export function isDead(state: number): boolean {
  return state >= State.DYING_START && state <= State.DYING_END;
}

export function calcDamageTaken(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): number {
  const percent = _.get(frame, 'percent', 0);
  const prevPercent = _.get(prevFrame, 'percent', 0);

  return percent - prevPercent;
}

function getSortedFrames(game: SlippiGame): Array<FrameEntryType> {
  // TODO: This is obviously jank and probably shouldn't be done this way. I just didn't
  // TODO: want the primary game object to have the concept of sortedFrames because it's
  // TODO: kinda shitty I need to do that anyway. It's required because javascript doesn't
  // TODO: support sorted objects... I could use a Map but that felt pretty heavy for
  // TODO: little reason.
  // if (_.has(game, ['external', 'sortedFrames'])) {
  //   // $FlowFixMe
  //   return game.external.sortedFrames;
  // }

  const frames = game.getFrames();
  const sortedFrames = _.orderBy(frames, 'frame');
  // _.set(game, ['external', 'sortedFrames'], sortedFrames);

  // $FlowFixMe
  return sortedFrames;
}

export function iterateFramesInOrder(
  game: SlippiGame,
  initialize: (indices: PlayerIndexedType) => void,
  processFrame: (indices: PlayerIndexedType, frame: FrameEntryType) => void
): void {
  const opponentIndices = getSinglesOpponentIndices(game);
  if (opponentIndices.length === 0) {
    return;
  }

  const sortedFrames = getSortedFrames(game);

  // Iterates through both of the player/opponent pairs
  opponentIndices.forEach(indices => {
    initialize(indices);

    // Iterates through all of the frames for the current player and opponent
    sortedFrames.forEach(frame => {
      const playerPostFrame = frame.players[indices.playerIndex].post;
      const oppPostFrame = frame.players[indices.opponentIndex].post;
      if (!playerPostFrame || !oppPostFrame) {
        // Don't attempt to compute stats on frames that have not been fully received
        return;
      }

      processFrame(indices, frame);
    });
  });
}

export function getLastFrame(game: SlippiGame): number | null {
  const sortedFrames = getSortedFrames(game);
  if (sortedFrames.length > 0) {
    const lastFrame = _.last(sortedFrames);
    return lastFrame.frame;
  }
  return null;
}

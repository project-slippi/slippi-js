import _ from "lodash";
import { PostFrameUpdateType, GameStartType } from "../types";

export interface StatsType {
  gameComplete: boolean;
  lastFrame: number;
  playableFrameCount: number;
  stocks: StockType[];
  conversions: ConversionType[];
  combos: ComboType[];
  actionCounts: ActionCountsType[];
  overall: OverallType[];
}

export interface RatioType {
  count: number;
  total: number;
  ratio: number | null;
}

export interface PlayerIndexedType {
  playerIndex: number;
  opponentIndices: number[];
}

export interface DurationType {
  startFrame: number;
  endFrame?: number | null;
}

export interface DamageType {
  startPercent: number;
  currentPercent: number;
  endPercent?: number | null;
}

export interface StockType extends DurationType, DamageType {
  playerIndex: number;
  count: number;
  deathAnimation?: number | null;
}

export interface MoveLandedType {
  frame: number;
  moveId: number;
  hitCount: number;
  damage: number;
  playerIndex: number;
}

export interface ConversionType extends DurationType, DamageType {
  playerIndex: number;
  moves: MoveLandedType[];
  openingType: string;
  didKill: boolean;
}

export interface ComboType extends DurationType, DamageType {
  playerIndex: number;
  moves: MoveLandedType[];
  didKill: boolean;
}

export interface ActionCountsType {
  playerIndex: number;
  wavedashCount: number;
  wavelandCount: number;
  airDodgeCount: number;
  dashDanceCount: number;
  spotDodgeCount: number;
  ledgegrabCount: number;
  rollCount: number;
  lCancelSuccessCount: number;
  lCancelFailCount: number;
}

export interface InputCountsType {
  buttons: number;
  triggers: number;
  joystick: number;
  cstick: number;
  total: number;
}

export interface OverallType {
  playerIndex: number;
  inputCounts: InputCountsType;
  conversionCount: number;
  totalDamage: number;
  killCount: number;
  successfulConversions: RatioType;
  inputsPerMinute: RatioType;
  digitalInputsPerMinute: RatioType;
  openingsPerKill: RatioType;
  damagePerOpening: RatioType;
  neutralWinRatio: RatioType[];
  counterHitRatio: RatioType[];
  beneficialTradeRatio: RatioType[];
}

export enum State {
  // Animation ID ranges
  DAMAGE_START = 0x4b,
  DAMAGE_END = 0x5b,
  CAPTURE_START = 0xdf,
  CAPTURE_END = 0xe8,
  GUARD_START = 0xb2,
  GUARD_END = 0xb6,
  GROUNDED_CONTROL_START = 0xe,
  GROUNDED_CONTROL_END = 0x18,
  SQUAT_START = 0x27,
  SQUAT_END = 0x29,
  DOWN_START = 0xb7,
  DOWN_END = 0xc6,
  TECH_START = 0xc7,
  TECH_END = 0xcc,
  DYING_START = 0x0,
  DYING_END = 0xa,
  CONTROLLED_JUMP_START = 0x18,
  CONTROLLED_JUMP_END = 0x22,
  GROUND_ATTACK_START = 0x2c,
  GROUND_ATTACK_END = 0x40,
  AERIAL_ATTACK_START = 0x41,
  AERIAL_ATTACK_END = 0x4a,

  // Animation ID specific
  ROLL_FORWARD = 0xe9,
  ROLL_BACKWARD = 0xea,
  SPOT_DODGE = 0xeb,
  AIR_DODGE = 0xec,
  ACTION_WAIT = 0xe,
  ACTION_DASH = 0x14,
  ACTION_KNEE_BEND = 0x18,
  GUARD_ON = 0xb2,
  TECH_MISS_UP = 0xb7,
  TECH_MISS_DOWN = 0xbf,
  DASH = 0x14,
  TURN = 0x12,
  LANDING_FALL_SPECIAL = 0x2b,
  JUMP_FORWARD = 0x19,
  JUMP_BACKWARD = 0x1a,
  FALL_FORWARD = 0x1e,
  FALL_BACKWARD = 0x1f,
  GRAB = 0xd4,
  CLIFF_CATCH = 0xfc,
}

export const Timers = {
  PUNISH_RESET_FRAMES: 45,
  RECOVERY_RESET_FRAMES: 45,
  COMBO_STRING_RESET_FRAMES: 45,
};

export function getPlayerPermutationsFromSettings(settings: GameStartType): PlayerIndexedType[] {
  if (!settings) {
    return [];
  }
  const playerIds: number[] = settings.players.map((v) => v.playerIndex);

  return settings.players.map((player) => {
    return {
      playerIndex: player.playerIndex,
      opponentIndices: _.without(playerIds, player.playerIndex),
    };
  });
}

export function didLoseStock(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): boolean {
  if (!frame || !prevFrame) {
    return false;
  }

  return prevFrame.stocksRemaining! - frame.stocksRemaining! > 0;
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
  const percent = frame.percent ?? 0;
  const prevPercent = prevFrame.percent ?? 0;

  return percent - prevPercent;
}

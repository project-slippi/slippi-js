import type { GameStartType, PostFrameUpdateType } from "../types";
import { Stage } from "../melee/types";

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

export type StadiumStatsType = HomeRunContestResultType | TargetTestResultType;

export interface TargetTestResultType {
  type: "target-test";
  targetBreaks: TargetBreakType[];
}

export interface HomeRunContestResultType {
  type: "home-run-contest";
  distance: number;
  units: "feet" | "meters";
}

export interface RatioType {
  count: number;
  total: number;
  ratio: number | null;
}

export interface PlayerIndexedType {
  playerIndex: number;
  opponentIndex: number;
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
  playerIndex: number;
  frame: number;
  moveId: number;
  hitCount: number;
  damage: number;
}

export interface ComboType extends DurationType, DamageType {
  playerIndex: number;
  moves: MoveLandedType[];
  didKill: boolean;
  lastHitBy: number | null;
}

export interface TargetBreakType {
  spawnId: number;
  frameDestroyed: number | null;
  positionX: number;
  positionY: number;
}

export interface ConversionType extends ComboType {
  openingType: string;
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
  lCancelCount: {
    success: number;
    fail: number;
  };
  attackCount: {
    jab1: number;
    jab2: number;
    jab3: number;
    jabm: number;
    dash: number;
    ftilt: number;
    utilt: number;
    dtilt: number;
    fsmash: number;
    usmash: number;
    dsmash: number;
    nair: number;
    fair: number;
    bair: number;
    uair: number;
    dair: number;
  };
  grabCount: {
    success: number;
    fail: number;
  };
  throwCount: {
    up: number;
    forward: number;
    back: number;
    down: number;
  };
  groundTechCount: {
    // tech away/in are in reference to the opponents position and not the stage
    away: number;
    in: number;
    neutral: number;
    fail: number;
  };
  wallTechCount: {
    success: number;
    fail: number;
  };
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
  neutralWinRatio: RatioType;
  counterHitRatio: RatioType;
  beneficialTradeRatio: RatioType;
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
  LEDGE_ACTION_START = 0xfc,
  LEDGE_ACTION_END = 0x107,
  CONTROLLED_JUMP_START = 0x18,
  CONTROLLED_JUMP_END = 0x22,
  GROUND_ATTACK_START = 0x2c,
  GROUND_ATTACK_END = 0x40,
  AERIAL_ATTACK_START = 0x41,
  AERIAL_ATTACK_END = 0x4a,
  ATTACK_FTILT_START = 0x33,
  ATTACK_FTILT_END = 0x37,
  ATTACK_FSMASH_START = 0x3a,
  ATTACK_FSMASH_END = 0x3e,
  GUARD_BREAK_START = 0xcd,
  GUARD_BREAK_END = 0xd3,
  DODGE_START = 0xe9,
  DODGE_END = 0xec,
  FALL_SPECIAL_START = 0x23,
  FALL_SPECIAL_END = 0x25,

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
  NEUTRAL_TECH = 0xc7,
  FORWARD_TECH = 0xc8,
  BACKWARD_TECH = 0xc9,
  WALL_TECH = 0xca,
  MISSED_WALL_TECH = 0xf7,
  DASH = 0x14,
  TURN = 0x12,
  LANDING_FALL_SPECIAL = 0x2b,
  JUMP_FORWARD = 0x19,
  JUMP_BACKWARD = 0x1a,
  FALL_FORWARD = 0x1e,
  FALL_BACKWARD = 0x1f,
  GRAB = 0xd4,
  DASH_GRAB = 0xd6,
  GRAB_WAIT = 0xd8,
  PUMMEL = 0xd9,
  CLIFF_CATCH = 0xfc,
  THROW_UP = 0xdd,
  THROW_FORWARD = 0xdb,
  THROW_DOWN = 0xde,
  THROW_BACK = 0xdc,
  DAMAGE_FALL = 0x26,
  ATTACK_JAB1 = 0x2c,
  ATTACK_JAB2 = 0x2d,
  ATTACK_JAB3 = 0x2e,
  ATTACK_JABM = 0x2f,
  ATTACK_DASH = 0x32,
  ATTACK_UTILT = 0x38,
  ATTACK_DTILT = 0x39,
  ATTACK_USMASH = 0x3f,
  ATTACK_DSMASH = 0x40,
  AERIAL_NAIR = 0x41,
  AERIAL_FAIR = 0x42,
  AERIAL_BAIR = 0x43,
  AERIAL_UAIR = 0x44,
  AERIAL_DAIR = 0x45,

  // Weird GnW IDs
  GNW_JAB1 = 0x155,
  GNW_JABM = 0x156,
  GNW_DTILT = 0x159,
  GNW_FSMASH = 0x15a,
  GNW_NAIR = 0x15b,
  GNW_BAIR = 0x15c,
  GNW_UAIR = 0x15d,

  // Peach FSMASH ID
  // FSMASH1 = Golf Club, FSMASH2 = Frying Pan, FSMASH3 = Tennis Racket
  PEACH_FSMASH1 = 0x15d,
  PEACH_FSMASH2 = 0x15e,
  PEACH_FSMASH3 = 0x15f,

  // Command Grabs
  BARREL_WAIT = 0x125,
  COMMAND_GRAB_RANGE1_START = 0x10a,
  COMMAND_GRAB_RANGE1_END = 0x130,

  COMMAND_GRAB_RANGE2_START = 0x147,
  COMMAND_GRAB_RANGE2_END = 0x152,
}

export const Timers = {
  PUNISH_RESET_FRAMES: 45,
  RECOVERY_RESET_FRAMES: 45,
  COMBO_STRING_RESET_FRAMES: 45,
};

export function getSinglesPlayerPermutationsFromSettings(settings: GameStartType): PlayerIndexedType[] {
  if (!settings || settings.players.length !== 2) {
    // Only return opponent indices for singles
    return [];
  }

  return [
    {
      playerIndex: settings.players[0]!.playerIndex,
      opponentIndex: settings.players[1]!.playerIndex,
    },
    {
      playerIndex: settings.players[1]!.playerIndex,
      opponentIndex: settings.players[0]!.playerIndex,
    },
  ];
}

export function didLoseStock(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): boolean {
  if (!frame || !prevFrame) {
    return false;
  }

  return prevFrame.stocksRemaining! - frame.stocksRemaining! > 0;
}

export function isTeching(state: number): boolean {
  return state >= State.TECH_START && state <= State.TECH_END;
}

export function isDown(state: number): boolean {
  return state >= State.DOWN_START && state <= State.DOWN_END;
}

export function isDamaged(state: number): boolean {
  return (state >= State.DAMAGE_START && state <= State.DAMAGE_END) || state === State.DAMAGE_FALL;
}

export function isGrabbed(state: number): boolean {
  return state >= State.CAPTURE_START && state <= State.CAPTURE_END;
}

// TODO: Find better implementation of 3 seperate ranges
export function isCommandGrabbed(state: number): boolean {
  return (
    ((state >= State.COMMAND_GRAB_RANGE1_START && state <= State.COMMAND_GRAB_RANGE1_END) ||
      (state >= State.COMMAND_GRAB_RANGE2_START && state <= State.COMMAND_GRAB_RANGE2_END)) &&
    state !== State.BARREL_WAIT
  );
}

export function isOffstage(
  position: (number | null)[],
  isAirborne: boolean | null,
  currStage?: number | null,
): boolean {
  if (!position || !currStage || isAirborne === false) {
    //if isAirborne is null, run the check anyway for backwards compatibility
    return false;
  }
  //-5 is below the main part of all legal stages. Just ignore the X value if the player is at or below this
  if (position[1]! <= -5) {
    return true;
  }

  let stageBounds = [0, 0];
  switch (currStage) {
    case Stage.FOUNTAIN_OF_DREAMS:
      stageBounds = [-64, 64];
      break;
    case Stage.YOSHIS_STORY:
      stageBounds = [-56, 56];
      break;
    case Stage.DREAMLAND:
      stageBounds = [-73, 73];
      break;
    case Stage.POKEMON_STADIUM:
      stageBounds = [-88, 88];
      break;
    case Stage.BATTLEFIELD:
      stageBounds = [-67, 67];
      break;
    case Stage.FINAL_DESTINATION:
      stageBounds = [-89, 89];
      break;
    default:
      return false;
  }
  return position[0]! < stageBounds[0]! && position[0]! > stageBounds[1]!;
}

export function isDodging(state: number): boolean {
  //not the greatest term, but captures rolling, spot dodging, and air dodging
  return state >= State.DODGE_START && state <= State.DODGE_END;
}

export function isShielding(state: number): boolean {
  return state >= State.GUARD_START && state <= State.GUARD_END;
}

export function isDead(state: number): boolean {
  return state >= State.DYING_START && state <= State.DYING_END;
}

export function isShieldBroken(state: number): boolean {
  return state >= State.GUARD_BREAK_START && state <= State.GUARD_BREAK_END;
}

export function isLedgeAction(state: number): boolean {
  return state >= State.LEDGE_ACTION_START && state <= State.LEDGE_ACTION_END;
}

export function isMaybeJuggled(
  position: (number | null)[],
  isAirborne: boolean | null,
  currStage?: number | null,
): boolean {
  if (!position || !currStage || !isAirborne) {
    return false;
  }

  let stageBounds = 0;

  switch (currStage) {
    case Stage.FOUNTAIN_OF_DREAMS:
      stageBounds = 42;
      break;
    case Stage.YOSHIS_STORY:
      stageBounds = 41;
      break;
    case Stage.DREAMLAND:
      stageBounds = 51;
      break;
    case Stage.POKEMON_STADIUM:
      //similar side plat heights to yoshi's, so we can steal the top plat height as well
      stageBounds = 41;
      break;
    case Stage.BATTLEFIELD:
      stageBounds = 54;
      break;
    case Stage.FINAL_DESTINATION:
      //No plats, so we'll just use a lower-than-average value
      stageBounds = 10; // or 45
      break;
    default:
      return false;
  }
  return position[1]! >= stageBounds!;
}

export function isSpecialFall(state: number): boolean {
  return state >= State.FALL_SPECIAL_START && state <= State.FALL_SPECIAL_END;
}

export function isUpBLag(state: number, prevState: number | null | undefined): boolean {
  if (!state || !prevState) {
    return false;
  }
  //allows resetting timer for land_fall_special without triggering due to wavedash/waveland
  //specifically useful for up b's like sheik's that have a unique animation id for ~40 frames of the endlag
  //rather than just going straight into fall_special -> land_fall_special
  return (
    state == State.LANDING_FALL_SPECIAL &&
    prevState != State.LANDING_FALL_SPECIAL &&
    prevState != State.ACTION_KNEE_BEND &&
    prevState != State.AIR_DODGE &&
    (prevState <= State.CONTROLLED_JUMP_START || prevState >= State.CONTROLLED_JUMP_END)
  );
}

export function calcDamageTaken(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): number {
  const percent = frame.percent ?? 0;
  const prevPercent = prevFrame.percent ?? 0;

  return percent - prevPercent;
}

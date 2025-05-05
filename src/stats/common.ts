import type { GameStartType, PostFrameUpdateType } from "../types";

export type StatsType = {
  gameComplete: boolean;
  lastFrame: number;
  playableFrameCount: number;
  stocks: StockType[];
  conversions: ConversionType[];
  combos: ComboType[];
  actionCounts: ActionCountsType[];
  overall: OverallType[];
};

export type StadiumStatsType = HomeRunContestResultType | TargetTestResultType;

export type TargetTestResultType = {
  type: "target-test";
  targetBreaks: TargetBreakType[];
};

export type HomeRunContestResultType = {
  type: "home-run-contest";
  distance: number;
  units: "feet" | "meters";
};

export type RatioType = {
  count: number;
  total: number;
  ratio: number | null;
};

export type PlayerIndexedType = {
  playerIndex: number;
  opponentIndex: number;
};

export type DurationType = {
  startFrame: number;
  endFrame?: number | null;
};

export type DamageType = {
  startPercent: number;
  currentPercent: number;
  endPercent?: number | null;
};

export type StockType = DurationType &
  DamageType & {
    playerIndex: number;
    count: number;
    deathAnimation?: number | null;
  };

export type MoveLandedType = {
  playerIndex: number;
  frame: number;
  moveId: number;
  hitCount: number;
  damage: number;
};

export type ComboType = DurationType &
  DamageType & {
    playerIndex: number;
    moves: MoveLandedType[];
    didKill: boolean;
    lastHitBy: number | null;
  };

export type TargetBreakType = {
  spawnId: number;
  frameDestroyed: number | null;
  positionX: number;
  positionY: number;
};

export type ConversionType = ComboType & {
  openingType: string;
};

export type ActionCountsType = {
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
};

export type InputCountsType = {
  buttons: number;
  triggers: number;
  joystick: number;
  cstick: number;
  total: number;
};

export type OverallType = {
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
};

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
  ATTACK_FTILT_START = 0x33,
  ATTACK_FTILT_END = 0x37,
  ATTACK_FSMASH_START = 0x3a,
  ATTACK_FSMASH_END = 0x3e,

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
  JAB_RESET_UP = 0xb9,
  TECH_MISS_DOWN = 0xbf,
  JAB_RESET_DOWN = 0xc1,
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

export enum Flags {
  BIT_1_1 = 1 << 0,
  // Active when any absorber hitbox is active (ness down b)
  ABSORB_BUBBLE = 1 << 1,
  BIT_1_3 = 1 << 2,
  // Active when REFLECT_BUBBLE is active, but the reflected projectile does not change ownership
  // (e.g. Mewtwo side b)
  REFLECT_NO_STEAL = 1 << 3,
  // Active when any projectile reflect bubble is active
  REFLECT_BUBBLE = 1 << 4,
  BIT_1_6 = 1 << 5,
  BIT_1_7 = 1 << 6,
  BIT_1_8 = 1 << 7,
  BIT_2_1 = 1 << 8,
  BIT_2_2 = 1 << 9,
  // "Active when a character recieves intangibility or invulnerability due to a subaction that
  // is removed when the subaction ends" - per UnclePunch. Little else is known besides this
  // description.
  SUBACTION_INVULN = 1 << 10,
  // Active when the character is fastfalling
  FASTFALL = 1 << 11,
  // Active when the character is in hitlag, and is the one being hit. Can be thought of as
  // `CAN_SDI`
  DEFENDER_HITLAG = 1 << 12,
  // Active when the character is in hitlag
  HITLAG = 1 << 13,
  BIT_2_7 = 1 << 14,
  BIT_2_8 = 1 << 15,
  BIT_3_1 = 1 << 16,
  BIT_3_2 = 1 << 17,
  // Active when the character has grabbed another character and is holding them
  GRAB_HOLD = 1 << 18,
  BIT_3_4 = 1 << 19,
  BIT_3_5 = 1 << 20,
  BIT_3_6 = 1 << 21,
  BIT_3_7 = 1 << 22,
  // Active when the character is shielding
  SHIELDING = 1 << 23,
  BIT_4_1 = 1 << 24,
  // Active when character is in hitstun
  HITSTUN = 1 << 25,
  // Dubious meaning, likely related to subframe events (per UnclePunch). Very little is known
  // besides offhand remarks
  HITBOX_TOUCHING_SHIELD = 1 << 26,
  BIT_4_4 = 1 << 27,
  BIT_4_5 = 1 << 28,
  // Active when character's physical OR projectile Powershield bubble is active
  POWERSHIELD_BUBBLE = 1 << 29,
  BIT_4_7 = 1 << 30,
  BIT_4_8 = 1 << 31,
  BIT_5_1 = 1 << 32,
  // Active when character is invisible due to cloaking device item/special mode toggle
  CLOAKING_DEVICE = 1 << 33,
  BIT_5_3 = 1 << 34,
  // Active when character is follower-type (e.g. Nana)
  FOLLOWER = 1 << 35,
  // Character is not processed. Corresponds to Action State `Sleep` (not to be confused with
  // `FURA_SLEEP` and `DAMAGE_SLEEP`)
  //
  // This is typically only relevant for shiek/zelda, and in doubles. When shiek is active, zelda
  // will have this flag active (and vice versa). When a doubles teammate has 0 stocks, this flag
  // is active as well.
  //
  // IMPORTANT: If this flag is active in a replay, something has gone horribly wrong. This is
  // the bit checked to determine whether or not slippi records a frame event for the character
  INACTIVE = 1 << 36,
  BIT_5_6 = 1 << 37,
  // Active when character is dead
  DEAD = 1 << 38,
  // Active when character is in the magnifying glass
  OFFSCREEN = 1 << 39,
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
  return (
    (state >= State.DAMAGE_START && state <= State.DAMAGE_END) ||
    state === State.DAMAGE_FALL ||
    state === State.JAB_RESET_UP ||
    state === State.JAB_RESET_DOWN
  );
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

export function isDead(state: number): boolean {
  return state >= State.DYING_START && state <= State.DYING_END;
}

export function calcDamageTaken(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): number {
  const percent = frame.percent ?? 0;
  const prevPercent = prevFrame.percent ?? 0;

  return percent - prevPercent;
}

export function isInHitstun(flags: bigint): boolean {
  return (flags & BigInt(Flags.HITSTUN)) !== BigInt(0);
}

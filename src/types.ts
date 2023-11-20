export enum Command {
  SPLIT_MESSAGE = 0x10,
  MESSAGE_SIZES = 0x35,
  GAME_START = 0x36,
  PRE_FRAME_UPDATE = 0x37,
  POST_FRAME_UPDATE = 0x38,
  GAME_END = 0x39,
  FRAME_START = 0x3a,
  ITEM_UPDATE = 0x3b,
  FRAME_BOOKEND = 0x3c,
  GECKO_LIST = 0x3d,
}

export type PlayerType = {
  playerIndex: number;
  port: number;
  characterId: number | null;
  type: number | null;
  startStocks: number | null;
  characterColor: number | null;
  teamShade: number | null;
  handicap: number | null;
  teamId: number | null;
  staminaMode: boolean | null;
  silentCharacter: boolean | null;
  invisible: boolean | null;
  lowGravity: boolean | null;
  blackStockIcon: boolean | null;
  metal: boolean | null;
  startOnAngelPlatform: boolean | null;
  rumbleEnabled: boolean | null;
  cpuLevel: number | null;
  offenseRatio: number | null;
  defenseRatio: number | null;
  modelScale: number | null;
  controllerFix: string | null;
  nametag: string | null;
  displayName: string;
  connectCode: string;
  userId: string;
};

export enum GameMode {
  VS = 0x02,
  ONLINE = 0x08,
  TARGET_TEST = 0x0f,
  HOME_RUN_CONTEST = 0x20,
}

export enum Language {
  JAPANESE = 0,
  ENGLISH = 1,
}

export type GameStartType = {
  slpVersion: string | null;
  timerType: TimerType | null;
  inGameMode: number | null;
  friendlyFireEnabled: boolean | null;
  isTeams: boolean | null;
  stageId: number | null;
  startingTimerSeconds: number | null;
  itemSpawnBehavior: ItemSpawnType | null;
  enabledItems: number | null;
  players: PlayerType[];
  scene: number | null;
  gameMode: GameMode | null;
  language: Language | null;
  gameInfoBlock: GameInfoType | null;
  randomSeed: number | null;
  isPAL: boolean | null;
  isFrozenPS: boolean | null;
  matchInfo: MatchInfo | null;
};

type MatchInfo = {
  matchId: string | null;
  gameNumber: number | null;
  tiebreakerNumber: number | null;
};

export type FrameStartType = {
  frame: number | null;
  seed: number | null;
  sceneFrameCounter: number | null;
};

export type GameInfoType = {
  gameBitfield1: number | null;
  gameBitfield2: number | null;
  gameBitfield3: number | null;
  gameBitfield4: number | null;
  bombRainEnabled: boolean | null;
  selfDestructScoreValue: number | null;
  itemSpawnBitfield1: number | null;
  itemSpawnBitfield2: number | null;
  itemSpawnBitfield3: number | null;
  itemSpawnBitfield4: number | null;
  itemSpawnBitfield5: number | null;
  damageRatio: number | null;
};

export enum TimerType {
  NONE = 0b00,
  DECREASING = 0b10,
  INCREASING = 0b11,
}

export enum ItemSpawnType {
  OFF = 0xff,
  VERY_LOW = 0x00,
  LOW = 0x01,
  MEDIUM = 0x02,
  HIGH = 0x03,
  VERY_HIGH = 0x04,
}

export enum EnabledItemType {
  METAL_BOX = 2 ** 0,
  CLOAKING_DEVICE = 2 ** 1,
  POKEBALL = 2 ** 2,
  // Bits 4 through 8 of item bitfield 1 are unknown
  UNKNOWN_ITEM_BIT_4 = 2 ** 3,
  UNKNOWN_ITEM_BIT_5 = 2 ** 4,
  UNKNOWN_ITEM_BIT_6 = 2 ** 5,
  UNKNOWN_ITEM_BIT_7 = 2 ** 6,
  UNKNOWN_ITEM_BIT_8 = 2 ** 7,
  FAN = 2 ** 8,
  FIRE_FLOWER = 2 ** 9,
  SUPER_MUSHROOM = 2 ** 10,
  POISON_MUSHROOM = 2 ** 11,
  HAMMER = 2 ** 12,
  WARP_STAR = 2 ** 13,
  SCREW_ATTACK = 2 ** 14,
  BUNNY_HOOD = 2 ** 15,
  RAY_GUN = 2 ** 16,
  FREEZIE = 2 ** 17,
  FOOD = 2 ** 18,
  MOTION_SENSOR_BOMB = 2 ** 19,
  FLIPPER = 2 ** 20,
  SUPER_SCOPE = 2 ** 21,
  STAR_ROD = 2 ** 22,
  LIPS_STICK = 2 ** 23,
  HEART_CONTAINER = 2 ** 24,
  MAXIM_TOMATO = 2 ** 25,
  STARMAN = 2 ** 26,
  HOME_RUN_BAT = 2 ** 27,
  BEAM_SWORD = 2 ** 28,
  PARASOL = 2 ** 29,
  GREEN_SHELL = 2 ** 30,
  RED_SHELL = 2 ** 31,
  CAPSULE = 2 ** 32,
  BOX = 2 ** 33,
  BARREL = 2 ** 34,
  EGG = 2 ** 35,
  PARTY_BALL = 2 ** 36,
  BARREL_CANNON = 2 ** 37,
  BOMB_OMB = 2 ** 38,
  MR_SATURN = 2 ** 39,
}

export type PreFrameUpdateType = {
  frame: number | null;
  playerIndex: number | null;
  isFollower: boolean | null;
  seed: number | null;
  actionStateId: number | null;
  positionX: number | null;
  positionY: number | null;
  facingDirection: number | null;
  joystickX: number | null;
  joystickY: number | null;
  cStickX: number | null;
  cStickY: number | null;
  trigger: number | null;
  buttons: number | null;
  physicalButtons: number | null;
  physicalLTrigger: number | null;
  physicalRTrigger: number | null;
  rawJoystickX: number | null;
  percent: number | null;
};

export type PostFrameUpdateType = {
  frame: number | null;
  playerIndex: number | null;
  isFollower: boolean | null;
  internalCharacterId: number | null;
  actionStateId: number | null;
  positionX: number | null;
  positionY: number | null;
  facingDirection: number | null;
  percent: number | null;
  shieldSize: number | null;
  lastAttackLanded: number | null;
  currentComboCount: number | null;
  lastHitBy: number | null;
  stocksRemaining: number | null;
  actionStateCounter: number | null;
  miscActionState: number | null;
  isAirborne: boolean | null;
  lastGroundId: number | null;
  jumpsRemaining: number | null;
  lCancelStatus: number | null;
  hurtboxCollisionState: number | null;
  selfInducedSpeeds: SelfInducedSpeedsType | null;
  hitlagRemaining: number | null;
  animationIndex: number | null;
  instanceHitBy: number | null;
  instanceId: number | null;
};

export type SelfInducedSpeedsType = {
  airX: number | null;
  y: number | null;
  attackX: number | null;
  attackY: number | null;
  groundX: number | null;
};

export type ItemUpdateType = {
  frame: number | null;
  typeId: number | null;
  state: number | null;
  facingDirection: number | null;
  velocityX: number | null;
  velocityY: number | null;
  positionX: number | null;
  positionY: number | null;
  damageTaken: number | null;
  expirationTimer: number | null;
  spawnId: number | null;
  missileType: number | null;
  turnipFace: number | null;
  chargeShotLaunched: number | null;
  chargePower: number | null;
  owner: number | null;
  instanceId: number | null;
};

export type FrameBookendType = {
  frame: number | null;
  latestFinalizedFrame: number | null;
};

export enum GameEndMethod {
  UNRESOLVED = 0,
  RESOLVED = 3,
  // The following options are only returned in version 2.0.0 onwards
  TIME = 1,
  GAME = 2,
  NO_CONTEST = 7,
}

export type GameEndType = {
  gameEndMethod: GameEndMethod | null;
  lrasInitiatorIndex: number | null;
  placements: PlacementType[];
};

export type PlacementType = {
  playerIndex: number;
  position: number | null;
};

export type GeckoListType = {
  codes: GeckoCodeType[];
  contents: Uint8Array;
};

export type GeckoCodeType = {
  type: number | null;
  address: number | null;
  contents: Uint8Array;
};

export type MetadataType = {
  startAt?: string | null;
  playedOn?: string | null;
  lastFrame?: number | null;
  players?: {
    [playerIndex: number]: {
      characters: {
        [internalCharacterId: number]: number;
      };
      names?: {
        netplay?: string | null;
        code?: string | null;
      };
    };
  } | null;
  consoleNick?: string | null;
};

export type EventPayloadTypes =
  | GameStartType
  | FrameStartType
  | PreFrameUpdateType
  | PostFrameUpdateType
  | ItemUpdateType
  | FrameBookendType
  | GameEndType
  | GeckoListType;

export type EventCallbackFunc = (
  command: Command,
  payload?: EventPayloadTypes | null,
  buffer?: Uint8Array | null,
) => boolean;

export type FrameEntryType = {
  frame: number;
  start?: FrameStartType;
  players: {
    [playerIndex: number]: {
      pre: PreFrameUpdateType;
      post: PostFrameUpdateType;
    } | null;
  };
  followers: {
    [playerIndex: number]: {
      pre: PreFrameUpdateType;
      post: PostFrameUpdateType;
    } | null;
  };
  items?: ItemUpdateType[];
};

export enum Frames {
  FIRST = -123,
  FIRST_PLAYABLE = -39,
}

export type FramesType = {
  [frameIndex: number]: FrameEntryType;
};

export type RollbackFramesType = {
  [frameIndex: number]: FrameEntryType[];
};

export type RollbackFrames = {
  frames: RollbackFramesType;
  count: number;
  lengths: number[];
};

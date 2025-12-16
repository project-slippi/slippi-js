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
  FOD_PLATFORM = 0x3f,
  WHISPY = 0x40,
  STADIUM_TRANSFORMATION = 0x41,
}

export type ControllerFixType = "None" | "Mixed" | "UCF" | "Dween";

export type PlayerType = {
  playerIndex: number;
  port: number;
  characterId: number | undefined;
  type: number | undefined;
  startStocks: number | undefined;
  characterColor: number | undefined;
  teamShade: number | undefined;
  handicap: number | undefined;
  teamId: number | undefined;
  staminaMode: boolean | undefined;
  silentCharacter: boolean | undefined;
  invisible: boolean | undefined;
  lowGravity: boolean | undefined;
  blackStockIcon: boolean | undefined;
  metal: boolean | undefined;
  startOnAngelPlatform: boolean | undefined;
  rumbleEnabled: boolean | undefined;
  cpuLevel: number | undefined;
  offenseRatio: number | undefined;
  defenseRatio: number | undefined;
  modelScale: number | undefined;
  controllerFix: ControllerFixType | undefined;
  nametag: string;
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
  slpVersion: string | undefined;
  timerType: TimerType | undefined;
  inGameMode: number | undefined;
  friendlyFireEnabled: boolean | undefined;
  isTeams: boolean | undefined;
  stageId: number | undefined;
  startingTimerSeconds: number | undefined;
  itemSpawnBehavior: ItemSpawnType | undefined;
  enabledItems: number | undefined;
  players: PlayerType[];
  scene: number | undefined;
  gameMode: GameMode | undefined;
  language: Language | undefined;
  gameInfoBlock: GameInfoType | undefined;
  randomSeed: number | undefined;
  isPAL: boolean | undefined;
  isFrozenPS: boolean | undefined;
  matchInfo: MatchInfo | undefined;
};

type MatchInfo = {
  sessionId: string | undefined;
  gameNumber: number | undefined;
  tiebreakerNumber: number | undefined;

  /** @deprecated since version 7.2.0. use sessionId instead */
  matchId: string | undefined;
};

export type FrameStartType = {
  frame: number | undefined;
  seed: number | undefined;
  sceneFrameCounter: number | undefined;
};

export type GameInfoType = {
  gameBitfield1: number | undefined;
  gameBitfield2: number | undefined;
  gameBitfield3: number | undefined;
  gameBitfield4: number | undefined;
  bombRainEnabled: boolean | undefined;
  selfDestructScoreValue: number | undefined;
  itemSpawnBitfield1: number | undefined;
  itemSpawnBitfield2: number | undefined;
  itemSpawnBitfield3: number | undefined;
  itemSpawnBitfield4: number | undefined;
  itemSpawnBitfield5: number | undefined;
  damageRatio: number | undefined;
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
  frame: number | undefined;
  playerIndex: number | undefined;
  isFollower: boolean | undefined;
  seed: number | undefined;
  actionStateId: number | undefined;
  positionX: number | undefined;
  positionY: number | undefined;
  facingDirection: number | undefined;
  joystickX: number | undefined;
  joystickY: number | undefined;
  cStickX: number | undefined;
  cStickY: number | undefined;
  trigger: number | undefined;
  buttons: number | undefined;
  physicalButtons: number | undefined;
  physicalLTrigger: number | undefined;
  physicalRTrigger: number | undefined;
  rawJoystickX: number | undefined;
  percent: number | undefined;
};

export type PostFrameUpdateType = {
  frame: number | undefined;
  playerIndex: number | undefined;
  isFollower: boolean | undefined;
  internalCharacterId: number | undefined;
  actionStateId: number | undefined;
  positionX: number | undefined;
  positionY: number | undefined;
  facingDirection: number | undefined;
  percent: number | undefined;
  shieldSize: number | undefined;
  lastAttackLanded: number | undefined;
  currentComboCount: number | undefined;
  lastHitBy: number | undefined;
  stocksRemaining: number | undefined;
  actionStateCounter: number | undefined;
  miscActionState: number | undefined;
  isAirborne: boolean | undefined;
  lastGroundId: number | undefined;
  jumpsRemaining: number | undefined;
  lCancelStatus: number | undefined;
  hurtboxCollisionState: number | undefined;
  selfInducedSpeeds: SelfInducedSpeedsType | undefined;
  hitlagRemaining: number | undefined;
  animationIndex: number | undefined;
  instanceHitBy: number | undefined;
  instanceId: number | undefined;
};

export type SelfInducedSpeedsType = {
  airX: number | undefined;
  y: number | undefined;
  attackX: number | undefined;
  attackY: number | undefined;
  groundX: number | undefined;
};

export type ItemUpdateType = {
  frame: number | undefined;
  typeId: number | undefined;
  state: number | undefined;
  facingDirection: number | undefined;
  velocityX: number | undefined;
  velocityY: number | undefined;
  positionX: number | undefined;
  positionY: number | undefined;
  damageTaken: number | undefined;
  expirationTimer: number | undefined;
  spawnId: number | undefined;
  missileType: number | undefined;
  turnipFace: number | undefined;
  chargeShotLaunched: number | undefined;
  chargePower: number | undefined;
  owner: number | undefined;
  instanceId: number | undefined;
};

export type FrameBookendType = {
  frame: number | undefined;
  latestFinalizedFrame: number | undefined;
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
  gameEndMethod: GameEndMethod | undefined;
  lrasInitiatorIndex: number | undefined;
  placements: PlacementType[];
};

export type PlacementType = {
  playerIndex: number;
  position: number | undefined;
};

export type GeckoListType = {
  codes: GeckoCodeType[];
  contents: Uint8Array;
};

export type GeckoCodeType = {
  type: number | undefined;
  address: number | undefined;
  contents: Uint8Array;
};

export enum FodPlatformSide {
  RIGHT = 0,
  LEFT = 1,
}

export type FodPlatformType = {
  frame: number | undefined;
  platform: FodPlatformSide | undefined;
  height: number | undefined;
};

export enum WhispyBlowDirection {
  NONE = 0,
  LEFT = 1,
  RIGHT = 2,
}

export type WhispyType = {
  frame: number | undefined;
  direction: WhispyBlowDirection | undefined;
};

export enum StadiumTransformation {
  FIRE = 3,
  GRASS = 4,
  NORMAL = 5,
  ROCK = 6,
  WATER = 9,
}

export enum StadiumTransformationEvent {
  INITIATE = 2,
  ON_MONITOR = 3,
  RECEDING = 4,
  RISING = 5,
  FINISH = 6,
}

export type StadiumTransformationType = {
  frame: number | undefined;
  event: StadiumTransformationEvent | undefined;
  transformation: StadiumTransformation | undefined;
};

export type MetadataType = {
  startAt?: string | null;
  playedOn?: "dolphin" | "network" | "nintendont" | null;
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
  | GeckoListType
  | FodPlatformType
  | WhispyType
  | StadiumTransformationType;

export type EventCallbackFunc = (command: Command, payload?: EventPayloadTypes, buffer?: Uint8Array) => boolean;

export type StageEventTypes = FodPlatformType | WhispyType | StadiumTransformationType;

export type FrameEntryType = {
  frame: number;
  start: FrameStartType | undefined;
  players: {
    [playerIndex: number]:
      | {
          pre: PreFrameUpdateType;
          post: PostFrameUpdateType;
        }
      | undefined;
  };
  followers: {
    [playerIndex: number]:
      | {
          pre: PreFrameUpdateType;
          post: PostFrameUpdateType;
        }
      | undefined;
  };
  items: ItemUpdateType[] | undefined;
  stageEvents: StageEventTypes[] | undefined;
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

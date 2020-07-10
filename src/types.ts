export enum Command {
  MESSAGE_SIZES = 0x35,
  GAME_START = 0x36,
  PRE_FRAME_UPDATE = 0x37,
  POST_FRAME_UPDATE = 0x38,
  GAME_END = 0x39,
  ITEM_UPDATE = 0x3b,
  FRAME_BOOKEND = 0x3c,
}

export interface PlayerType {
  playerIndex: number;
  port: number;
  characterId: number | null;
  characterColor: number | null;
  startStocks: number | null;
  type: number | null;
  teamId: number | null;
  controllerFix: string | null;
  nametag: string | null;
}

export interface GameStartType {
  slpVersion: string | null;
  isTeams: boolean | null;
  isPAL: boolean | null;
  stageId: number | null;
  players: PlayerType[];
}

export interface PreFrameUpdateType {
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
  percent: number | null;
}

export interface PostFrameUpdateType {
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
  lCancelStatus: number | null;
}

export interface ItemUpdateType {
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
}

export interface FrameBookendType {
  frame: number | null;
}

export interface GameEndType {
  gameEndMethod: number | null;
  lrasInitiatorIndex: number | null;
}

export interface MetadataType {
  startAt?: string | null;
  playedOn?: string | null;
  lastFrame?: number | null;
  players?: {
    [playerIndex: number]: {
      characters: {
        [internalCharacterId: number]: number;
      };
    };
  } | null;
}

export type EventPayloadTypes =
  | GameStartType
  | PreFrameUpdateType
  | PostFrameUpdateType
  | ItemUpdateType
  | FrameBookendType
  | GameEndType;

export type EventCallbackFunc = (command: Command, payload?: EventPayloadTypes | null) => boolean;

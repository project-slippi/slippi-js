import type { TypedEventEmitter } from "../../common/utils/typedEventEmitter";

export enum ConnectionEvent {
  CONNECT = "connect",
  MESSAGE = "message",
  HANDSHAKE = "handshake",
  STATUS_CHANGE = "statusChange",
  DATA = "data",
  ERROR = "error",
  BROADCAST = "broadcast",
}

export type ConnectionEventMap = {
  [ConnectionEvent.CONNECT]: undefined;
  [ConnectionEvent.MESSAGE]: unknown;
  [ConnectionEvent.HANDSHAKE]: ConnectionDetails;
  [ConnectionEvent.STATUS_CHANGE]: ConnectionStatus;
  [ConnectionEvent.DATA]: Uint8Array;
  [ConnectionEvent.ERROR]: unknown;
  [ConnectionEvent.BROADCAST]: BroadcastMessage;
};

export enum ConnectionStatus {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  RECONNECT_WAIT = 3,
}

export enum BroadcastMessageType {
  CONNECT_REPLY = "connect_reply",
  GAME_EVENT = "game_event",
  START_GAME = "start_game",
  END_GAME = "end_game",
}

export type BroadcastMessage = {
  type: BroadcastMessageType;
  cursor: number;
  nextCursor: number;
  payload?: string; // Base64 encoded
  nick?: string;
};

export enum Ports {
  DEFAULT = 51441,
  LEGACY = 666,
  RELAY_START = 53741,
}

export type ConnectionDetails = {
  consoleNick: string;
  gameDataCursor: number | Uint8Array;
  version: string;
  clientToken?: number;
};

export type ConnectionSettings = {
  ipAddress: string;
  port: number;
};

export interface Connection extends TypedEventEmitter<ConnectionEventMap> {
  getStatus(): ConnectionStatus;
  getSettings(): ConnectionSettings;
  getDetails(): ConnectionDetails;
  connect(ip: string, port: number): void;
  disconnect(): void;
}

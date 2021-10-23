import type { EventEmitter } from "events";

export enum ConnectionEvent {
  CONNECT = "connect",
  MESSAGE = "message",
  HANDSHAKE = "handshake",
  STATUS_CHANGE = "statusChange",
  DATA = "data",
  ERROR = "error",
}

export enum ConnectionStatus {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  RECONNECT_WAIT = 3,
}

export enum Ports {
  DEFAULT = 51441,
  LEGACY = 666,
  RELAY_START = 53741,
}

export interface ConnectionDetails {
  consoleNick: string;
  gameDataCursor: number | Uint8Array;
  version: string;
  clientToken?: number;
}

export interface ConnectionSettings {
  ipAddress: string;
  port: number;
}

export interface Connection extends EventEmitter {
  getStatus(): ConnectionStatus;
  getSettings(): ConnectionSettings;
  getDetails(): ConnectionDetails;
  connect(ip: string, port: number): void;
  disconnect(): void;
}

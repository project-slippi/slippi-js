import { EventEmitter } from "events";

export enum ConnectionEvent {
  HANDSHAKE = "handshake",
  STATUS_CHANGE = "statusChange",
  DATA = "data",
  INFO = "loginfo",
  WARN = "logwarn",
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
  gameDataCursor: Uint8Array;
  version: string;
  clientToken: number;
}

export interface ConnectionSettings {
  ipAddress: string;
  port: number;
}

export interface Connection extends EventEmitter {
  getStatus(): ConnectionStatus;
  getSettings(): ConnectionSettings;
  getDetails(): ConnectionDetails;
  connect(ip: string, port: number, timeout: number): void;
  disconnect(): void;
}

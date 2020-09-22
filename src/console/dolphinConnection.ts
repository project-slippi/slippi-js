import enet from "enet";

import { EventEmitter } from "events";
import { Connection, ConnectionStatus, ConnectionSettings, ConnectionDetails, Ports, ConnectionEvent } from "./types";

const MAX_PEERS = 32;

export enum DolphinMessageType {
  CONNECT_REPLY = "connect_reply",
  GAME_EVENT = "game_event",
}

export class DolphinConnection extends EventEmitter implements Connection {
  private ipAddress: string;
  private port: number;
  private connectionStatus = ConnectionStatus.DISCONNECTED;
  private gameCursor = 0;
  private nickname = "unknown";
  private version = "";
  private client: enet.Host;
  private peer: enet.Peer | null = null;

  public constructor() {
    super();
    this.ipAddress = "0.0.0.0";
    this.port = Ports.DEFAULT;

    // Create the enet client
    this.client = enet.createClient({ peers: MAX_PEERS, channels: 3, down: 0, up: 0 }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }

  /**
   * @returns The current connection status.
   */
  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * @returns The IP address and port of the current connection.
   */
  public getSettings(): ConnectionSettings {
    return {
      ipAddress: this.ipAddress,
      port: this.port,
    };
  }

  public getDetails(): ConnectionDetails {
    return {
      consoleNick: this.nickname,
      gameDataCursor: this.gameCursor,
      version: this.version,
    };
  }

  public connect(ip: string, port: number): void {
    console.log(`Connecting to: ${ip}:${port}`);
    this.ipAddress = ip;
    this.port = port;

    this.peer = this.client.connect(
      {
        address: this.ipAddress,
        port: this.port,
      },
      3,
      1337, // Data to send, not sure what this is or what this represents
      (err, newPeer) => {
        if (err) {
          console.error(err);
          return;
        }

        newPeer.ping();
        this.emit(ConnectionEvent.CONNECT);
        this._setStatus(ConnectionStatus.CONNECTED);
      },
    );

    this.peer.on("connect", () => {
      // Reset the game cursor to the beginning of the game. Do we need to do this or
      // should it just continue from where it left off?
      this.gameCursor = 0;

      const request = {
        type: "connect_request",
        cursor: this.gameCursor,
      };
      const packet = new enet.Packet(JSON.stringify(request), enet.PACKET_FLAG.RELIABLE);
      this.peer.send(0, packet);
    });

    this.peer.on("message", (packet: enet.Packet) => {
      const data = packet.data();
      if (data.length === 0) {
        return;
      }

      const message = JSON.parse(data.toString("ascii"));
      this.emit(ConnectionEvent.MESSAGE, message);
      switch (message.type) {
        case DolphinMessageType.CONNECT_REPLY:
          this.connectionStatus = ConnectionStatus.CONNECTED;
          this.gameCursor = message.cursor;
          this.nickname = message.nick;
          this.version = message.version;
          this.emit(ConnectionEvent.HANDSHAKE, this.getDetails());
          break;
        case DolphinMessageType.GAME_EVENT:
          const { payload, cursor, next_cursor } = message;
          if (!payload) {
            // We got a disconnection request
            this.disconnect();
            return;
          }

          if (this.gameCursor !== cursor) {
            throw new Error(`Unexpected game data cursor. Expected: ${this.gameCursor} but got: ${cursor}`);
          }

          const gameData = Buffer.from(payload, "base64");
          this.gameCursor = next_cursor;
          this._handleReplayData(gameData);
          break;
      }
    });

    this.peer.on("disconnect", () => {
      this.disconnect();
    });

    this._setStatus(ConnectionStatus.CONNECTING);
  }

  public disconnect(): void {
    if (this.peer) {
      this.peer.disconnect();
      this.peer = null;
    }
    this._setStatus(ConnectionStatus.DISCONNECTED);
  }

  private _handleReplayData(data: Uint8Array): void {
    this.emit(ConnectionEvent.DATA, data);
  }

  private _setStatus(status: ConnectionStatus): void {
    // Don't fire the event if the status hasn't actually changed
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emit(ConnectionEvent.STATUS_CHANGE, this.connectionStatus);
    }
  }
}

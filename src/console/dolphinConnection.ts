import { EventEmitter } from "events";

import { Connection, ConnectionDetails, ConnectionEvent, ConnectionSettings, ConnectionStatus, Ports } from "./types";

const MAX_PEERS = 32;

export enum DolphinMessageType {
  CONNECT_REPLY = "connect_reply",
  GAME_EVENT = "game_event",
  START_GAME = "start_game",
  END_GAME = "end_game",
}

export class DolphinConnection extends EventEmitter implements Connection {
  private ipAddress: string;
  private port: number;
  private connectionStatus = ConnectionStatus.DISCONNECTED;
  private gameCursor = 0;
  private nickname = "unknown";
  private version = "";
  private peer: any | null = null;

  public constructor() {
    super();
    this.ipAddress = "0.0.0.0";
    this.port = Ports.DEFAULT;
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

  public async connect(ip: string, port: number): Promise<void> {
    console.log(`Connecting to: ${ip}:${port}`);
    this.ipAddress = ip;
    this.port = port;

    const enet = await import("enet");
    // Create the enet client
    const client = enet.createClient({ peers: MAX_PEERS, channels: 3, down: 0, up: 0 }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    this.peer = client.connect(
      {
        address: this.ipAddress,
        port: this.port,
      },
      3,
      1337, // Data to send, not sure what this is or what this represents
      (err: any, newPeer: any) => {
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

    this.peer.on("message", (packet: any) => {
      const data = packet.data();
      if (data.length === 0) {
        return;
      }

      const dataString = data.toString("ascii");
      const message = JSON.parse(dataString);
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
          const { payload, cursor } = message;
          if (!payload) {
            // We got a disconnection request
            this.disconnect();
            return;
          }

          if (this.gameCursor !== cursor) {
            const err = new Error(
              `Unexpected game data cursor. Expected: ${this.gameCursor} but got: ${cursor}. Payload: ${dataString}`,
            );
            console.error(err);
            this.emit(ConnectionEvent.ERROR, err);
          }

          const gameData = Buffer.from(payload, "base64");
          this.gameCursor = message.next_cursor;
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

import enet from "enet";

import { EventEmitter } from "events";
import { Connection, ConnectionStatus, ConnectionSettings, ConnectionDetails, Ports, ConnectionEvent } from "./types";

const MAX_PEERS = 32;

enum MessageType {
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

    this.peer.on("message", (packet: enet.Packet, _channel: any) => {
      const data = packet.data();
      if (data.length === 0) {
        return;
      }

      const message = JSON.parse(data.toString("ascii"));
      switch (message.type) {
        case MessageType.CONNECT_REPLY:
          this.connectionStatus = ConnectionStatus.CONNECTED;
          this.gameCursor = message.cursor;
          this.nickname = message.nick;
          this.version = message.version;
          this.emit(ConnectionEvent.HANDSHAKE, this.getDetails());
          break;
        case MessageType.GAME_EVENT:
          const cursor = message.cursor;
          if (this.gameCursor !== cursor) {
            throw new Error(`Unexpected game data cursor. Expected: ${this.gameCursor} but got: ${cursor}`);
          }

          this.gameCursor = message.next_cursor;
          const gameData = Buffer.from(message.payload, "base64");
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
    this._setStatus(ConnectionStatus.DISCONNECTED);
    this.peer = null;
  }

  private _handleReplayData(data: Uint8Array): void {
    this.emit(ConnectionEvent.DATA, data);
  }

  private _setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.emit(ConnectionEvent.STATUS_CHANGE, this.connectionStatus);
  }
}

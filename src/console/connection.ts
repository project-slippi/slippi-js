import net from 'net';
import { EventEmitter } from 'events';

import inject from 'reconnect-core';

import { ConsoleCommunication, CommunicationType, CommunicationMessage } from './communication';

export const NETWORK_MESSAGE = 'HELO\0';

const DEFAULT_CONNECTION_TIMEOUT_MS = 20000;

export enum ConnectionEvent {
  HANDSHAKE = 'handshake',
  STATUS_CHANGE = 'statusChange',
  DATA = 'data',
  INFO = 'loginfo',
  WARN = 'logwarn',
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

enum CommunicationState {
  INITIAL = 'initial',
  LEGACY = 'legacy',
  NORMAL = 'normal',
}

const defaultConnectionDetails: ConnectionDetails = {
  consoleNick: 'unknown',
  gameDataCursor: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]),
  version: '',
  clientToken: 0,
};

/**
 * Responsible for maintaining connection to a Slippi relay connection or Wii connection.
 * Events are emitted whenever data is received.
 *
 * Basic usage example:
 *
 * ```javascript
 * const { ConsoleConnection } = require("@slippi/sdk");
 *
 * const connection = new ConsoleConnection();
 * connection.connect("localhost", 667); // You should set these values appropriately
 *
 * connection.on("data", (data) => {
 *   // Received data from console
 *   console.log(data);
 * });
 *
 * connection.on("statusChange", (status) => {
 *   console.log(`status changed: ${status}`);
 * });
 * ```
 */
export class ConsoleConnection extends EventEmitter {
  private ipAddress: string;
  private port: number;
  private connectionStatus = ConnectionStatus.DISCONNECTED;
  private connDetails: ConnectionDetails = { ...defaultConnectionDetails };
  private clientsByPort: Array<net.Socket>;
  private connectionsByPort: Array<inject.Instance<unknown, net.Socket>>;

  public constructor() {
    super();
    this.ipAddress = '0.0.0.0';
    this.port = Ports.DEFAULT;
    this.clientsByPort = [];
    this.connectionsByPort = [];
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

  /**
   * @returns The specific details about the connected console.
   */
  public getDetails(): ConnectionDetails {
    return this.connDetails;
  }

  /**
   * Initiate a connection to the Wii or Slippi relay.
   * @param ip   The IP address of the Wii or Slippi relay.
   * @param port The port to connect to.
   * @param timeout Optional. The timeout in milliseconds when attempting to connect
   *                to the Wii or relay. Default: 5000.
   */
  public connect(ip: string, port: number, timeout = DEFAULT_CONNECTION_TIMEOUT_MS): void {
    this.ipAddress = ip;

    if (this.port && this.port !== Ports.LEGACY && this.port !== Ports.DEFAULT) {
      // If port is manually set, use that port. Don't do this if the port is set to legacy as
      // somebody might have accidentally set it to that and they would encounter issues with
      // the new Nintendont
      this._connectOnPort(port, timeout);
      return;
    }

    this._connectOnPort(Ports.DEFAULT, timeout);
    this._connectOnPort(Ports.LEGACY, timeout);
  }

  private _connectOnPort(port: number, timeout: number): void {
    // set up reconnect
    const reconnect = inject(() =>
      net.connect({
        host: this.ipAddress,
        port: port,
        timeout: timeout,
      }),
    );

    // Indicate we are connecting
    this._setStatus(ConnectionStatus.CONNECTING);

    // Prepare console communication obj for talking UBJSON
    const consoleComms = new ConsoleCommunication();

    // TODO: reconnect on failed reconnect, not sure how
    // TODO: to do this
    const connection = reconnect(
      {
        initialDelay: 2000,
        maxDelay: 10000,
        strategy: 'fibonacci',
        failAfter: Infinity,
      },
      (client) => {
        this.clientsByPort[port] = client;

        let commState: CommunicationState = CommunicationState.INITIAL;
        client.on('data', (data) => {
          if (commState === CommunicationState.INITIAL) {
            commState = this._getInitialCommState(data);
            console.log(`Connected to ${this.ipAddress}:${this.port} with type: ${commState}`);
            this._setStatus(ConnectionStatus.CONNECTED);
            console.log(data.toString('hex'));
          }

          if (commState === CommunicationState.LEGACY) {
            // If the first message received was not a handshake message, either we
            // connected to an old Nintendont version or a relay instance
            this._handleReplayData(data);
            return;
          }

          try {
            consoleComms.receive(data);
          } catch (err) {
            console.warn('Failed to process new data from server...', {
              error: err,
              prevDataBuf: consoleComms.getReceiveBuffer(),
              rcvData: data,
            });
            client.destroy();

            return;
          }
          const messages = consoleComms.getMessages();

          // Process all of the received messages
          try {
            messages.forEach((message) => this._processMessage(message));
          } catch (err) {
            // Disconnect client to send another handshake message
            client.destroy();
            console.error(err);
          }
        });

        client.on('timeout', () => {
          // const previouslyConnected = this.connectionStatus === ConnectionStatus.CONNECTED;
          console.warn(`Attempted connection to ${this.ipAddress}:${this.port} timed out after ${timeout}ms`);
          client.destroy();
        });

        client.on('end', () => {
          console.log('disconnect');
          client.destroy();
        });

        client.on('close', () => {
          console.log('connection was closed');
        });

        const handshakeMsgOut = consoleComms.genHandshakeOut(
          this.connDetails.gameDataCursor,
          this.connDetails.clientToken,
        );

        client.write(handshakeMsgOut);
      },
    );

    const setConnectingStatus = (): void => {
      // Indicate we are connecting
      this._setStatus(ConnectionStatus.CONNECTING);
    };

    connection.on('connect', setConnectingStatus);
    connection.on('reconnect', setConnectingStatus);

    connection.on('disconnect', () => {
      // If one of the connections was successful, we no longer need to try connecting this one
      this.connectionsByPort.forEach((iConn, iPort) => {
        if (iPort === port || !iConn.connected) {
          // Only disconnect if a different connection was connected
          return;
        }

        // Prevent reconnections and disconnect
        connection.reconnect = false;
        connection.disconnect();
      });

      // TODO: Figure out how to set RECONNECT_WAIT state here. Currently it will stay on
      // TODO: Connecting... forever
    });

    connection.on('error', (error) => {
      console.error(`Connection on port ${port} encountered an error.`, error);
    });

    this.connectionsByPort[port] = connection;
    console.log('Starting connection');
    connection.connect(port);
  }

  /**
   * Terminate the current connection.
   */
  public disconnect(): void {
    console.log('Disconnect request');

    this.connectionsByPort.forEach((connection) => {
      // Prevent reconnections and disconnect
      connection.reconnect = false; // eslint-disable-line
      connection.disconnect();
    });

    this.clientsByPort.forEach((client) => {
      client.destroy();
    });
    this._setStatus(ConnectionStatus.DISCONNECTED);
  }

  private _getInitialCommState(data: Buffer): CommunicationState {
    if (data.length < 13) {
      return CommunicationState.LEGACY;
    }

    const openingBytes = Buffer.from([0x7b, 0x69, 0x04, 0x74, 0x79, 0x70, 0x65, 0x55, 0x01]);

    const dataStart = data.slice(4, 13);

    return dataStart.equals(openingBytes) ? CommunicationState.NORMAL : CommunicationState.LEGACY;
  }

  private _processMessage(message: CommunicationMessage): void {
    switch (message.type) {
      case CommunicationType.KEEP_ALIVE:
        // console.log("Keep alive message received");

        // TODO: This is the jankiest shit ever but it will allow for relay connections not
        // TODO: to time out as long as the main connection is still receving keep alive messages
        // TODO: Need to figure out a better solution for this. There should be no need to have an
        // TODO: active Wii connection for the relay connection to keep itself alive
        const fakeKeepAlive = Buffer.from(NETWORK_MESSAGE);
        this._handleReplayData(fakeKeepAlive);

        break;
      case CommunicationType.REPLAY:
        const readPos = Uint8Array.from(message.payload.pos);
        const cmp = Buffer.compare(this.connDetails.gameDataCursor, readPos);
        if (!message.payload.forcePos && cmp !== 0) {
          console.warn(
            'Position of received data is not what was expected. Expected, Received:',
            this.connDetails.gameDataCursor,
            readPos,
          );

          // The readPos is not the one we are waiting on, throw error
          throw new Error('Position of received data is incorrect.');
        }

        if (message.payload.forcePos) {
          console.warn(
            'Overflow occured in Nintendont, data has likely been skipped and replay corrupted. ' +
              'Expected, Received:',
            this.connDetails.gameDataCursor,
            readPos,
          );
        }

        this.connDetails.gameDataCursor = Uint8Array.from(message.payload.pos);

        const data = Uint8Array.from(message.payload.data);
        this._handleReplayData(data);
        break;
      case CommunicationType.HANDSHAKE:
        this.connDetails.consoleNick = message.payload.nick;
        const tokenBuf = Buffer.from(message.payload.clientToken);
        this.connDetails.clientToken = tokenBuf.readUInt32BE(0);
        this.connDetails.version = message.payload.nintendontVersion;
        this.connDetails.gameDataCursor = Uint8Array.from(message.payload.pos);
        this.emit(ConnectionEvent.HANDSHAKE, this.connDetails);
        break;
      default:
        // Should this be an error?
        break;
    }
  }

  private _handleReplayData(data: Uint8Array): void {
    this.emit(ConnectionEvent.DATA, data);
  }

  private _setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.emit(ConnectionEvent.STATUS_CHANGE, this.connectionStatus);
  }
}

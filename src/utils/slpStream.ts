import { Writable, WritableOptions } from "stream";
import { Command, EventPayloadTypes } from "../types";
import { parseMessage } from "./slpReader";
import { NETWORK_MESSAGE } from "../console/connection";

export enum SlpStreamMode {
  AUTO = "AUTO", // Always reading data, but errors on invalid command
  MANUAL = "MANUAL", // Stops parsing inputs after a valid game end command, requires manual restarting
}

const defaultSettings = {
  suppressErrors: false,
  mode: SlpStreamMode.AUTO,
};

export type SlpStreamSettings = typeof defaultSettings;

export type MessageSizes = Map<Command, number>;

export interface SlpCommandEventPayload {
  command: Command;
  payload: EventPayloadTypes | MessageSizes;
}

export interface SlpRawEventPayload {
  command: Command;
  payload: Buffer;
}

export enum SlpStreamEvent {
  RAW = "slp-raw",
  COMMAND = "slp-command",
}

/**
 * SlpStream is a writable stream of Slippi data. It passes the data being written in
 * and emits an event based on what kind of Slippi messages were processed.
 *
 * SlpStream emits two events: "slp-raw" and "slp-command". The "slp-raw" event emits the raw buffer
 * bytes whenever it processes each command. You can manually parse this or write it to a
 * file. The "slp-command" event returns the parsed payload which you can access the attributes.
 *
 * @class SlpStream
 * @extends {Writable}
 */
export class SlpStream extends Writable {
  private gameEnded = false;
  private settings: SlpStreamSettings;
  private payloadSizes: MessageSizes | null = null;
  private previousBuffer: Uint8Array = Buffer.from([]);

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @param {WritableOptions} [opts]
   * @memberof SlpStream
   */
  public constructor(slpOptions?: Partial<SlpStreamSettings>, opts?: WritableOptions) {
    super(opts);
    this.settings = Object.assign({}, defaultSettings, slpOptions);
  }

  public restart() {
    this.gameEnded = false;
    this.payloadSizes = null;
    this.previousBuffer = Buffer.from([]);
  }

  public _write(newData: Buffer, encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    if (encoding !== "buffer") {
      throw new Error(`Unsupported stream encoding. Expected 'buffer' got '${encoding}'.`);
    }

    if (this.settings.mode === SlpStreamMode.MANUAL && this.gameEnded) {
      // We're in manual mode and the game has already ended so just return immediately
      callback();
      return;
    }

    // Join the current data with the old data
    const data = Uint8Array.from(Buffer.concat([this.previousBuffer, newData]));

    // Clear previous data
    this.previousBuffer = Buffer.from([]);

    const dataView = new DataView(data.buffer);

    // Iterate through the data
    let index = 0;
    while (index < data.length) {
      // We want to filter out the network messages
      if (Buffer.from(data.slice(index, index + 5)).toString() === NETWORK_MESSAGE) {
        index += 5;
        continue;
      }

      // Make sure we have enough data to read a full payload
      const command = dataView.getUint8(index);
      const payloadSize = this.payloadSizes && this.payloadSizes.has(command) ? this.payloadSizes.get(command) : 0;
      const remainingLen = data.length - index;
      if (remainingLen < payloadSize + 1) {
        // If remaining length is not long enough for full payload, save the remaining
        // data until we receive more data. The data has been split up.
        this.previousBuffer = data.slice(index);
        break;
      }

      // Increment by one for the command byte
      index += 1;

      const payloadPtr = data.slice(index);
      const payloadDataView = new DataView(data.buffer, index);
      let payloadLen = 0;
      try {
        payloadLen = this._processCommand(command, payloadPtr, payloadDataView);
      } catch (err) {
        // Only throw the error if we're not suppressing the errors
        if (!this.settings.suppressErrors) {
          throw err;
        }
        payloadLen = 0;
      }
      index += payloadLen;
    }

    callback();
  }

  private _writeCommand(command: Command, entirePayload: Uint8Array, payloadSize: number): Uint8Array {
    const payloadBuf = entirePayload.slice(0, payloadSize);
    const bufToWrite = Buffer.concat([Buffer.from([command]), payloadBuf]);
    // Forward the raw buffer onwards
    this.emit(SlpStreamEvent.RAW, {
      command: command,
      payload: bufToWrite,
    } as SlpRawEventPayload);
    return new Uint8Array(bufToWrite);
  }

  private _processCommand(command: Command, entirePayload: Uint8Array, dataView: DataView): number {
    // Handle the message size command
    if (command === Command.MESSAGE_SIZES && this.payloadSizes === null) {
      const payloadSize = dataView.getUint8(0);
      // Set the payload sizes
      this.payloadSizes = processReceiveCommands(dataView);
      // Emit the raw command event
      this._writeCommand(command, entirePayload, payloadSize);
      this.emit(SlpStreamEvent.COMMAND, {
        command: command,
        payload: this.payloadSizes,
      } as SlpCommandEventPayload);
      return payloadSize;
    }

    const payloadSize = this.payloadSizes && this.payloadSizes.has(command) ? this.payloadSizes.get(command) : 0;

    // Fetch the payload and parse it
    let payload: Uint8Array;
    let parsedPayload: any;
    if (payloadSize > 0) {
      payload = this._writeCommand(command, entirePayload, payloadSize);
      parsedPayload = parseMessage(command, payload);
    }
    if (!parsedPayload) {
      return payloadSize;
    }

    switch (command) {
      case Command.GAME_END:
        // Reset players
        this.payloadSizes = null;
        // Stop parsing data until we manually restart the stream
        if (this.settings.mode === SlpStreamMode.MANUAL) {
          this.gameEnded = true;
        }
        break;
    }

    this.emit(SlpStreamEvent.COMMAND, {
      command: command,
      payload: parsedPayload,
    } as SlpCommandEventPayload);
    return payloadSize;
  }
}

const processReceiveCommands = (dataView: DataView): MessageSizes => {
  const payloadSizes = new Map<Command, number>();
  const payloadLen = dataView.getUint8(0);
  for (let i = 1; i < payloadLen; i += 3) {
    const commandByte = dataView.getUint8(i);
    const payloadSize = dataView.getUint16(i + 1);
    payloadSizes.set(commandByte, payloadSize);
  }
  return payloadSizes;
};

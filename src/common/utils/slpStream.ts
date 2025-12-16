import type { EventPayloadTypes } from "../types";
import { Command } from "../types";
import { parseMessage } from "./slpReader";
import { TypedEventEmitter } from "./typedEventEmitter";

export const NETWORK_MESSAGE = "HELO\0";

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

export type SlpCommandEventPayload = {
  command: Command;
  payload: EventPayloadTypes | MessageSizes;
};

export type SlpRawEventPayload = {
  command: Command;
  payload: Uint8Array;
};

export enum SlpStreamEvent {
  RAW = "slp-raw",
  COMMAND = "slp-command",
}

type SlpStreamEventMap = {
  [SlpStreamEvent.RAW]: SlpRawEventPayload;
  [SlpStreamEvent.COMMAND]: SlpCommandEventPayload;
};

/**
 * SlpStream processes a stream of Slippi data and emits events based on the commands received.
 *
 * SlpStream emits two events: "slp-raw" and "slp-command". The "slp-raw" event emits the raw buffer
 * bytes whenever it processes each command. You can manually parse this or write it to a
 * file. The "slp-command" event returns the parsed payload which you can access the attributes.
 *
 * @class SlpStream
 * @extends {TypedEventEmitter}
 */
export class SlpStream extends TypedEventEmitter<SlpStreamEventMap> {
  private gameEnded = false; // True only if in manual mode and the game has completed
  private settings: SlpStreamSettings;
  private payloadSizes?: MessageSizes;
  private previousBuffer: Uint8Array = new Uint8Array(0);
  private readonly utf8Decoder = new TextDecoder("utf-8");

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @memberof SlpStream
   */
  public constructor(slpOptions?: Partial<SlpStreamSettings>) {
    super();
    this.settings = Object.assign({}, defaultSettings, slpOptions);
  }

  public restart(): void {
    this.gameEnded = false;
    this.payloadSizes = undefined;
  }

  /**
   * Process a chunk of data. This is the main entry point for feeding data
   * into the stream processor.
   */
  public process(newData: Uint8Array): void {
    // Join the current data with the old data
    const combinedLength = this.previousBuffer.length + newData.length;
    const data = new Uint8Array(combinedLength);
    data.set(this.previousBuffer, 0);
    data.set(newData, this.previousBuffer.length);

    // Clear previous data
    this.previousBuffer = new Uint8Array(0);

    const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

    // Iterate through the data
    let index = 0;
    while (index < data.length) {
      // We want to filter out the network messages
      const networkMsgSlice = data.subarray(index, index + 5);
      if (this.utf8Decoder.decode(networkMsgSlice) === NETWORK_MESSAGE) {
        index += 5;
        continue;
      }

      // Make sure we have enough data to read a full payload
      const command = dataView.getUint8(index);
      let payloadSize = 0;
      if (this.payloadSizes) {
        payloadSize = this.payloadSizes.get(command) ?? 0;
      }
      const remainingLen = data.length - index;
      if (remainingLen < payloadSize + 1) {
        // If remaining length is not long enough for full payload, save the remaining
        // data until we receive more data. The data has been split up.
        this.previousBuffer = data.slice(index);
        break;
      }

      // Only process if the game is still going
      if (this.settings.mode === SlpStreamMode.MANUAL && this.gameEnded) {
        break;
      }

      // Increment by one for the command byte
      index += 1;

      const payloadPtr = data.subarray(index);
      const payloadDataView = new DataView(data.buffer, data.byteOffset + index, data.byteLength - index);
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
  }

  private _writeCommand(command: Command, entirePayload: Uint8Array, payloadSize: number): Uint8Array {
    const payloadBuf = entirePayload.subarray(0, payloadSize);
    // Concatenate command byte with payload
    const bufToWrite = new Uint8Array(1 + payloadBuf.length);
    bufToWrite[0] = command;
    bufToWrite.set(payloadBuf, 1);

    // Forward the raw buffer onwards
    const event: SlpRawEventPayload = {
      command: command,
      payload: bufToWrite,
    };
    this.emit(SlpStreamEvent.RAW, event);
    return bufToWrite;
  }

  private _processCommand(command: Command, entirePayload: Uint8Array, dataView: DataView): number {
    // Handle the message size command
    if (command === Command.MESSAGE_SIZES) {
      const payloadSize = dataView.getUint8(0);
      // Set the payload sizes
      this.payloadSizes = processReceiveCommands(dataView);
      // Emit the raw command event
      this._writeCommand(command, entirePayload, payloadSize);
      const eventPayload: SlpCommandEventPayload = {
        command: command,
        payload: this.payloadSizes,
      };
      this.emit(SlpStreamEvent.COMMAND, eventPayload);
      return payloadSize;
    }

    let payloadSize = 0;
    if (this.payloadSizes) {
      payloadSize = this.payloadSizes.get(command) ?? 0;
    }

    // Fetch the payload and parse it
    let payload: Uint8Array;
    let parsedPayload: EventPayloadTypes | undefined = undefined;
    if (payloadSize > 0) {
      payload = this._writeCommand(command, entirePayload, payloadSize);
      parsedPayload = parseMessage(command, payload);
    }
    if (!parsedPayload) {
      return payloadSize;
    }

    switch (command) {
      case Command.GAME_END:
        // Stop parsing data until we manually restart the stream
        if (this.settings.mode === SlpStreamMode.MANUAL) {
          this.gameEnded = true;
        }
        break;
    }

    const eventPayload: SlpCommandEventPayload = {
      command: command,
      payload: parsedPayload,
    };
    this.emit(SlpStreamEvent.COMMAND, eventPayload);
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

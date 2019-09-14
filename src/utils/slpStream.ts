import EventEmitter from "events";

import { Readable } from "stream";
import { Command, parseMessage } from "./slpReader";


export enum SlpEvent {
  GAME_START = "gameStart",
  PRE_FRAME_UPDATE = "preFrameUpdate",
  POST_FRAME_UPDATE = "postFrameUpdate",
  GAME_END = "gameEnd",
}

export class SlpStream extends EventEmitter {
  metadataSet = false;

  stream: Readable;
  rawDataPosition: number;
  rawDataLength: number;
  metadataPosition: number;
  metadataLength: number;
  messageSizes: null | { [cmd: number]: number };
  totalDataRead: number;
  startPos: number | null = null;
  rawData: Buffer;

  constructor(stream: Readable) {
    super();
    this.stream = stream;
    this.totalDataRead = 0;
    this.messageSizes = null;

    stream.on('readable', () => {
      if (!this.metadataSet) {
        this.rawDataPosition = this._getRawDataPosition();
        this.rawDataLength = this._getRawDataLength(this.rawDataPosition);
        this._getMessageSizes();
        console.log(this.rawDataPosition);
        console.log(this.rawDataLength);
        console.log(this.messageSizes);
        this.metadataSet = true;
      }

      let command: Buffer;
      while (null !== (command = this._readStream(1))) {
        this._handleChunk(command[0]);
      }
    });

    stream.on('end', () => {
      this._setMetadataLength();
      console.log(this.metadataPosition);
      console.log(this.metadataLength);
    });
  }

  private _readStream(size?: number): any {
    const buf = this.stream.read(size);
    if (buf !== null) {
      // console.log(buf.length);
      this.totalDataRead += buf.length;
    }
    return buf;
  }

  private _handleChunk(command: Command): void {
    const messageSize = this.messageSizes[command];
    if (!messageSize) {
      // We don't have an entry for this command
      return;
    }

    const message = this._readStream(messageSize);
    if (!message) {
      // We've reached the end of the read stream
      return;
    }

    const cmdBuffer = new Uint8Array([command]);
    const payload = new Uint8Array(Buffer.concat([cmdBuffer, message]));
    const parsedPayload = parseMessage(command, payload);
    if (!parsedPayload) {
      // Failed to parse
      return;
    }

    switch (command) {
      case Command.GAME_START:
        this.emit(SlpEvent.GAME_START, command, parsedPayload);
        break;
      case Command.GAME_END:
        this.emit(SlpEvent.GAME_END, command, parsedPayload);
        break;
      case Command.PRE_FRAME_UPDATE:
        this.emit(SlpEvent.PRE_FRAME_UPDATE, command, parsedPayload);
        break;
      case Command.POST_FRAME_UPDATE:
        this.emit(SlpEvent.POST_FRAME_UPDATE, command, parsedPayload);
        break;
      default:
        break;
    }
  }

  private _setMetadataLength(): void {
    this.metadataPosition = this.rawDataPosition + this.rawDataLength + 10; // remove metadata string
    this.metadataLength = this.totalDataRead - this.metadataPosition - 1;
  }
  private _getMessageSizes(): void {
    if (this.messageSizes !== null) {
      return;
    }

    this.messageSizes = {};

    // Support old file format
    if (this.rawDataPosition === 0) {
      this.messageSizes[0x36] = 0x140;
      this.messageSizes[0x37] = 0x6;
      this.messageSizes[0x38] = 0x46;
      this.messageSizes[0x39] = 0x1;
    }

    const buffer = this._readStream(2);
    if (buffer[0] !== Command.MESSAGE_SIZES) {
      return;
    }

    const payloadLength = buffer[1];
    this.messageSizes[0x35] = payloadLength;

    const messageSizesBuffer = this._readStream(payloadLength - 1);
    for (let i = 0; i < payloadLength - 1; i += 3) {
      const command = messageSizesBuffer[i];

      // Get size of command
      this.messageSizes[command] = messageSizesBuffer[i + 1] << 8 | messageSizesBuffer[i + 2];
    }
  }

  // This function gets the position where the raw data starts
  private _getRawDataPosition(): number {
    const buffer = this._readStream(1);
    if (buffer[0] === 0x36) {
      return 0;
    }

    if (buffer[0] !== '{'.charCodeAt(0)) {
      return 0; // return error?
    }

    return 15;
  }

  private _getRawDataLength(position: number): number {
    const fileSize = this.stream.readableLength;
    if (position === 0) {
      return fileSize;
    }

    // take the intermediary data off the buffer
    this._readStream(position - 5);

    const buffer = this._readStream(4);
    const rawDataLen = buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3];
    if (rawDataLen > 0) {
      // If this method manages to read a number, it's probably trustworthy
      return rawDataLen;
    }

    // If the above does not return a valid data length,
    // return a file size based on file length. This enables
    // some support for severed files
    return fileSize - position;
  }
}

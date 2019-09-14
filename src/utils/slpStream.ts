import { Readable } from "stream";
import { Command } from "./slpReader";

export class SlpStream {
  metadataSet = false;

  stream: Readable;

  rawDataPosition: number;
  rawDataLength: number;
  metadataPosition: number;
  metadataLength: number;
  messageSizes: {[cmd: number]: number}
  totalDataRead: number;

  constructor(stream: Readable) {
    this.totalDataRead = 0;
    stream.on('readable', () => {
      let chunk;
      while (null !== (chunk = stream.read())) {
        this.totalDataRead += chunk.length;
        this.setMetadata(chunk);
        console.log('chunk: ', chunk);
      }
    });

    stream.on('end', () => {
      this.setMetadataLength();
      console.log(this.metadataPosition);
      console.log(this.metadataLength);
    });
  }

  setMetadata(chunk: Buffer): void {
    if (this.metadataSet) {
      return;
    }
    this.rawDataPosition = getRawDataPosition(chunk);
    this.rawDataLength = getRawDataLength(chunk, this.rawDataPosition);
    this.messageSizes = getMessageSizes(chunk, this.rawDataPosition);
    console.log(this.rawDataPosition);
    console.log(this.rawDataLength);
    console.log(this.messageSizes);
    this.metadataSet = true;
  }

  setMetadataLength(): void {
    this.metadataPosition = this.rawDataPosition + this.rawDataLength + 10; // remove metadata string
    this.metadataLength = this.totalDataRead - this.metadataPosition - 1;
  }
}

// This function gets the position where the raw data starts
function getRawDataPosition(chunk: Buffer): number {
  const buffer = new Uint8Array(1);
  readRef(chunk, buffer, 0, buffer.length, 0);

  if (buffer[0] === 0x36) {
    return 0;
  }

  if (buffer[0] !== '{'.charCodeAt(0)) {
    return 0; // return error?
  }

  return 15;
}

function readRef(chunk: Buffer, buffer: Uint8Array, offset: number, length: number, position: number): number {
  return chunk.copy(buffer, offset, position, position + length);
}

function getRawDataLength(chunk: Buffer, position: number): number {
  const fileSize = chunk.length;
  if (position === 0) {
    return fileSize;
  }

  const buffer = new Uint8Array(4);
  readRef(chunk, buffer, 0, buffer.length, position - 4);

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

function getMessageSizes(chunk: Buffer, position: number): {
  [command: number]: number;
} {
  const messageSizes: {
    [command: number]: number;
  } = {};
  // Support old file format
  if (position === 0) {
    messageSizes[0x36] = 0x140;
    messageSizes[0x37] = 0x6;
    messageSizes[0x38] = 0x46;
    messageSizes[0x39] = 0x1;
    return messageSizes;
  }

  const buffer = new Uint8Array(2);
  readRef(chunk, buffer, 0, buffer.length, position);
  if (buffer[0] !== Command.MESSAGE_SIZES) {
    return {};
  }

  const payloadLength = buffer[1];
  messageSizes[0x35] = payloadLength;

  const messageSizesBuffer = new Uint8Array(payloadLength - 1);
  readRef(chunk, messageSizesBuffer, 0, messageSizesBuffer.length, position + 2);
  for (let i = 0; i < payloadLength - 1; i += 3) {
    const command = messageSizesBuffer[i];

    // Get size of command
    messageSizes[command] = messageSizesBuffer[i + 1] << 8 | messageSizesBuffer[i + 2];
  }

  return messageSizes;
}

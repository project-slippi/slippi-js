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


  constructor(stream: Readable) {
    stream.on('readable', () => {
      let chunk;
      while (null !== (chunk = stream.read())) {
        this.setMetadata(chunk);
        console.log('chunk: ', chunk);
      }
    })
  }

  setMetadata(chunk: Buffer): void {
    if (this.metadataSet) {
      return;
    }
    const rawDataPosition = getRawDataPosition(chunk);
    const rawDataLength = getRawDataLength(chunk, rawDataPosition);
    const metadataPosition = rawDataPosition + rawDataLength + 10; // remove metadata string
    const metadataLength = getMetadataLength(chunk, metadataPosition);
    const messageSizes = getMessageSizes(chunk, rawDataPosition);
    console.log(rawDataPosition);
    console.log(rawDataLength);
    console.log(metadataPosition);
    console.log(metadataLength);
    console.log(messageSizes);
    this.metadataSet = true;
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

function getMetadataLength(chunk: Buffer, position: number): number {
  const len = chunk.length;
  return len - position - 1;
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

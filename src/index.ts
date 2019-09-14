import { SlippiGame } from './SlippiGame';

import * as animations from './melee/animations';
import * as characters from './melee/characters';
import * as moves from './melee/moves';
import * as stages from './melee/stages';

import fs from "fs";
import { Readable } from 'stream';
import { Command } from './utils/slpReader';

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};


class SlpStream {
  metadataSet = false;

  stream: Readable;

  rawDataPosition: number;
  rawDataLength: number;
  metadataPosition: number;
  metadataLength: number;
  messageSizes: {[cmd: number]: number}


  constructor(stream: Readable) {
    stream.on('readable', () => {
      this.setMetadata(stream);
      let chunk;
      while (null !== (chunk = stream.read())) {
        console.log('chunk: ', chunk);
      }
    })
  }

  setMetadata(stream: Readable): void {
    if (this.metadataSet) {
      return;
    }
    this.rawDataPosition = getRawDataPosition(stream);
    console.log(this.rawDataPosition);
    this.rawDataLength = getRawDataLength(stream);
    console.log(this.rawDataLength);
    // this.metadataPosition = this.rawDataPosition + this.rawDataLength + 10; // remove metadata string
    // this.metadataLength = getMetadataLength(chunk, this.metadataPosition);
    // this.messageSizes = getMessageSizes(chunk, this.rawDataPosition);
    this.metadataSet = true;
  }
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
  readStreamRef(chunk, buffer, 0, buffer.length, position);
  if (buffer[0] !== Command.MESSAGE_SIZES) {
    return {};
  }

  const payloadLength = buffer[1];
  messageSizes[0x35] = payloadLength;

  const messageSizesBuffer = new Uint8Array(payloadLength - 1);
  readStreamRef(chunk, messageSizesBuffer, 0, messageSizesBuffer.length, position + 2);
  for (let i = 0; i < payloadLength - 1; i += 3) {
    const command = messageSizesBuffer[i];

    // Get size of command
    messageSizes[command] = messageSizesBuffer[i + 1] << 8 | messageSizesBuffer[i + 2];
  }

  return messageSizes;
}


function readStreamRef(sourceBuffer: Buffer, buffer: Uint8Array, offset: number, length: number, position: number): number {
    return sourceBuffer.copy(buffer, offset, position, position + length);
}

function getRawDataPosition(stream: Readable): number {
  const buffer = stream.read(1);
  if (buffer[0] === 0x36) {
    return 0;
  }
  if (buffer[0] !== '{'.charCodeAt(0)) {
    return 0; // return error?
  }
  return 15;
}

function getRawDataLength(stream: Readable): number {
  const buffer = stream.read(4);
  const rawDataLen = buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3];
  if (rawDataLen > 0) {
    // If this method manages to read a number, it's probably trustworthy
    return rawDataLen;
  }

  // If the above does not return a valid data length,
  // return a file size based on file length. This enables
  // some support for severed files
  return stream.readableLength
}

function getMetadataLength(chunk: Buffer, position: number): number {
  const len = chunk.length;
  return len - position - 1;
}

const stream = fs.createReadStream("slp/sheik_vs_ics_yoshis.slp");
const slp = new SlpStream(stream);



export default SlippiGame;

// @flow
import _ from 'lodash';
import fs from 'fs';
import iconv from 'iconv-lite';
import ubjson from '@shelacek/ubjson';

import { toHalfwidth } from './fullwidth';

export const Commands = {
  MESSAGE_SIZES: 0x35,
  GAME_START: 0x36,
  PRE_FRAME_UPDATE: 0x37,
  POST_FRAME_UPDATE: 0x38,
  GAME_END: 0x39
};

export type SlpFileType = {
  fileDescriptor: number,
  rawDataPosition: number,
  rawDataLength: number,
  metadataPosition: number,
  metadataLength: number,
  messageSizes: { [command: number]: number }
}

export type PlayerType = {|
  playerIndex: number,
  port: number,
  characterId: number | null,
  characterColor: number | null,
  startStocks: number | null,
  type: number | null,
  teamId: number | null,
  controllerFix: string | null,
  nametag: string | null
|};

export type GameStartType = {|
  isTeams: boolean | null,
  isPAL: boolean | null,
  stageId: number | null,
  players: PlayerType[]
|};

export type PreFrameUpdateType = {|
  frame: number | null,
  playerIndex: number | null,
  isFollower: boolean | null,
  seed: number | null,
  actionStateId: number | null,
  positionX: number | null,
  positionY: number | null,
  facingDirection: number | null,
  joystickX: number | null,
  joystickY: number | null,
  cStickX: number | null,
  cStickY: number | null,
  trigger: number | null,
  buttons: number | null,
  physicalButtons: number | null,
  physicalLTrigger: number | null,
  physicalRTrigger: number | null,
  percent: number | null,
|};

export type PostFrameUpdateType = {|
  frame: number | null,
  playerIndex: number | null,
  isFollower: boolean | null,
  internalCharacterId: number | null,
  actionStateId: number | null,
  positionX: number | null,
  positionY: number | null,
  facingDirection: number | null,
  percent: number | null,
  shieldSize: number | null,
  lastAttackLanded: number | null,
  currentComboCount: number | null,
  lastHitBy: number | null,
  stocksRemaining: number | null,
  actionStateCounter: number | null,
|};


export type GameEndType = {|
  gameEndMethod: number | null,
  lrasInitiatorIndex: number | null,
|};

export type MetadataType = {
  startAt: ?string,
  playedOn: ?string,
  lastFrame: ?number,
  players: ?{
    [playerIndex: number]: {
      characters: {
        [internalCharacterId: number]: number
      }
    }
  }
};

/**
 * Opens a file at path
 */
export function openSlpFile(path: string): SlpFileType {
  const fd = fs.openSync(path, "r");

  const rawDataPosition = getRawDataPosition(fd);
  const rawDataLength = getRawDataLength(fd, rawDataPosition);
  const metadataPosition = rawDataPosition + rawDataLength + 10; // remove metadata string
  const metadataLength = getMetadataLength(fd, metadataPosition);
  const messageSizes = getMessageSizes(fd, rawDataPosition);

  return {
    fileDescriptor: fd,
    rawDataPosition: rawDataPosition,
    rawDataLength: rawDataLength,
    metadataPosition: metadataPosition,
    metadataLength: metadataLength,
    messageSizes: messageSizes
  };
}

// This function gets the position where the raw data starts
function getRawDataPosition(fd) {
  const buffer = new Uint8Array(1);
  // $FlowFixMe
  fs.readSync(fd, buffer, 0, buffer.length, 0);

  if (buffer[0] === 0x36) {
    return 0;
  }

  if (buffer[0] !== '{'.charCodeAt(0)) {
    return 0; // return error?
  }

  return 15;
}

function getRawDataLength(fd: number, position: number) {
  const fileStats = fs.fstatSync(fd) || {};
  const fileSize = fileStats.size;
  if (position === 0) {
    return fileSize;
  }

  const endBytes = new Uint8Array(2);
  // $FlowFixMe
  fs.readSync(fd, endBytes, 0, 2, fileSize - 2);
  const endFileByte = '}'.charCodeAt(0);
  if (endBytes[0] !== endFileByte && endBytes[1] !== endFileByte) {
    // If the two final bytes do not close out the UBJSON file,
    // return a file size based on file length. This enables
    // some support for severed files
    return fileSize - position;
  }

  const buffer = new Uint8Array(4);
  // $FlowFixMe
  fs.readSync(fd, buffer, 0, buffer.length, position - 4);

  return buffer[0] << 24 | buffer[1] << 16 | buffer[2] << 8 | buffer[3];
}

function getMetadataLength(fd: number, position: number) {
  const fileStats = fs.fstatSync(fd) || {};
  return fileStats.size - position - 1;
}

function getMessageSizes(fd: number, position: number): { [command: number]: number } {
  const messageSizes: { [command: number]: number } = {};
  // Support old file format
  if (position === 0) {
    messageSizes[0x36] = 0x140;
    messageSizes[0x37] = 0x6;
    messageSizes[0x38] = 0x46;
    messageSizes[0x39] = 0x1;
    return messageSizes;
  }

  const buffer = new Uint8Array(2);
  // $FlowFixMe
  fs.readSync(fd, buffer, 0, buffer.length, position);
  if (buffer[0] !== Commands.MESSAGE_SIZES) {
    return {};
  }

  const payloadLength = buffer[1];
  messageSizes[0x35] = payloadLength;

  const messageSizesBuffer = new Uint8Array(payloadLength - 1);
  // $FlowFixMe
  fs.readSync(fd, messageSizesBuffer, 0, messageSizesBuffer.length, position + 2);
  for (let i = 0; i < payloadLength - 1; i += 3) {
    const command = messageSizesBuffer[i];

    // Get size of command
    messageSizes[command] = messageSizesBuffer[i + 1] << 8 | messageSizesBuffer[i + 2];
  }

  return messageSizes;
}

type EventPayloadTypes = (
  GameStartType | PreFrameUpdateType | PostFrameUpdateType | GameEndType
);
type EventCallbackFunc = (command: number, payload: ?EventPayloadTypes) => boolean;

/**
 * Iterates through slp events and parses payloads
 */
export function iterateEvents(
  slpFile: SlpFileType, callback: EventCallbackFunc, startPos: number | null = null
): number {
  const fd = slpFile.fileDescriptor;

  let readPosition = startPos || slpFile.rawDataPosition;
  const stopReadingAt = slpFile.rawDataPosition + slpFile.rawDataLength;

  // Generate read buffers for each
  const commandPayloadBuffers = _.mapValues(slpFile.messageSizes, (size) => (
    new Uint8Array(size + 1)
  ));

  const commandByteBuffer = new Uint8Array(1);
  while (readPosition < stopReadingAt) {
    // $FlowFixMe
    fs.readSync(fd, commandByteBuffer, 0, 1, readPosition);
    const commandByte = commandByteBuffer[0];
    const buffer = commandPayloadBuffers[commandByte];
    if (buffer === undefined) {
      // If we don't have an entry for this command, return false to indicate failed read
      return readPosition;
    }

    if (buffer.length > stopReadingAt - readPosition) {
      return readPosition;
    }

    fs.readSync(fd, buffer, 0, buffer.length, readPosition);
    const parsedPayload = parseMessage(commandByte, buffer);
    const shouldStop = callback(commandByte, parsedPayload);
    if (shouldStop) {
      break;
    }

    readPosition += buffer.length;
  }

  return readPosition;
}

function parseMessage(command, payload): ?EventPayloadTypes {
  const view = new DataView(payload.buffer);
  switch (command) {
  case Commands.GAME_START:
    return {
      isTeams: readBool(view, 0xD),
      isPAL: readBool(view, 0x1A1),
      stageId: readUint16(view, 0x13),
      players: _.map([0, 1, 2, 3], playerIndex => {
        // Controller Fix stuff
        const cfOffset = playerIndex * 0x8;
        const dashback = readUint32(view, 0x141 + cfOffset);
        const shieldDrop = readUint32(view, 0x145 + cfOffset);
        let cfOption = "None";
        if (dashback !== shieldDrop) {
          cfOption = "Mixed";
        } else if (dashback === 1) {
          cfOption = "UCF";
        } else if (dashback === 2) {
          cfOption = "Dween";
        }

        // Nametag stuff
        const nametagOffset = playerIndex * 0x10;
        const nametagStart = 0x161 + nametagOffset;
        const nametagBuf = payload.slice(nametagStart, nametagStart + 16);
        const nametag = toHalfwidth(iconv.decode(nametagBuf, 'Shift_JIS').split('\0').shift());

        const offset = playerIndex * 0x24;
        return {
          playerIndex: playerIndex,
          port: playerIndex + 1,
          characterId: readUint8(view, 0x65 + offset),
          characterColor: readUint8(view, 0x68 + offset),
          startStocks: readUint8(view, 0x67 + offset),
          type: readUint8(view, 0x66 + offset),
          teamId: readUint8(view, 0x6E + offset),
          controllerFix: cfOption,
          nametag: nametag,
        };
      })
    };
  case Commands.PRE_FRAME_UPDATE:
    return {
      frame: readInt32(view, 0x1),
      playerIndex: readUint8(view, 0x5),
      isFollower: readBool(view, 0x6),
      seed: readUint32(view, 0x7),
      actionStateId: readUint16(view, 0xB),
      positionX: readFloat(view, 0xD),
      positionY: readFloat(view, 0x11),
      facingDirection: readFloat(view, 0x15),
      joystickX: readFloat(view, 0x19),
      joystickY: readFloat(view, 0x1D),
      cStickX: readFloat(view, 0x21),
      cStickY: readFloat(view, 0x25),
      trigger: readFloat(view, 0x29),
      buttons: readUint32(view, 0x2D),
      physicalButtons: readUint16(view, 0x31),
      physicalLTrigger: readFloat(view, 0x33),
      physicalRTrigger: readFloat(view, 0x37),
      percent: readFloat(view, 0x3C),
    };
  case Commands.POST_FRAME_UPDATE:
    return {
      frame: readInt32(view, 0x1),
      playerIndex: readUint8(view, 0x5),
      isFollower: readBool(view, 0x6),
      internalCharacterId: readUint8(view, 0x7),
      actionStateId: readUint16(view, 0x8),
      positionX: readFloat(view, 0xA),
      positionY: readFloat(view, 0xE),
      facingDirection: readFloat(view, 0x12),
      percent: readFloat(view, 0x16),
      shieldSize: readFloat(view, 0x1A),
      lastAttackLanded: readUint8(view, 0x1E),
      currentComboCount: readUint8(view, 0x1F),
      lastHitBy: readUint8(view, 0x20),
      stocksRemaining: readUint8(view, 0x21),
      actionStateCounter: readFloat(view, 0x22),
    };
  case Commands.GAME_END:
    return {
      gameEndMethod: readUint8(view, 0x1),
      lrasInitiatorIndex: readInt8(view, 0x2),
    };
  default:
    return null;
  }
}

function canReadFromView(view: DataView, offset, length) {
  const viewLength = view.byteLength;
  return offset + length <= viewLength;
}

function readFloat(view: DataView, offset: number): number | null {
  if (!canReadFromView(view, offset, 4)) {
    return null;
  }

  return view.getFloat32(offset);
}

function readInt32(view: DataView, offset: number): number | null {
  if (!canReadFromView(view, offset, 4)) {
    return null;
  }

  return view.getInt32(offset);
}

function readInt8(view: DataView, offset: number): number | null {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return view.getInt8(offset);
}

function readUint32(view: DataView, offset: number): number | null {
  if (!canReadFromView(view, offset, 4)) {
    return null;
  }

  return view.getUint32(offset);
}

function readUint16(view: DataView, offset: number): number | null {
  if (!canReadFromView(view, offset, 2)) {
    return null;
  }

  return view.getUint16(offset);
}

function readUint8(view: DataView, offset: number): number | null {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return view.getUint8(offset);
}

function readBool(view: DataView, offset: number): boolean | null {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return !!view.getUint8(offset);
}

export function getMetadata(slpFile: SlpFileType): MetadataType {
  if (slpFile.metadataLength <= 0) {
    // This will happen on a severed incomplete file
    // $FlowFixMe
    return {};
  }

  const buffer = new Uint8Array(slpFile.metadataLength);

  // $FlowFixMe
  fs.readSync(slpFile.fileDescriptor, buffer, 0, buffer.length, slpFile.metadataPosition);

  let metadata = {};
  try {
    metadata = ubjson.decode(buffer);
  } catch (ex) {
    // Do nothing
    console.log(ex);
  }

  // $FlowFixMe
  return metadata;
}

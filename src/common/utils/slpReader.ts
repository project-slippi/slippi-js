import { decode as decodeUBJSON } from "@shelacek/ubjson";
import { decode as decodeSJIS } from "iconv-cp932";
import mapValues from "lodash/mapValues";

import type {
  EventCallbackFunc,
  EventPayloadTypes,
  GameEndType,
  GameInfoType,
  GameStartType,
  GeckoCodeType,
  MetadataType,
  PlacementType,
  PlayerType,
  PostFrameUpdateType,
  SelfInducedSpeedsType,
} from "../types";
import { Command } from "../types";
import { exists } from "./exists";
import { toHalfwidth } from "./fullwidth";
import type { SlpInputRef } from "./slpInputRef";

const utf8Decoder = new TextDecoder("utf-8");

export type SlpFileType = {
  ref: SlpInputRef;
  rawDataPosition: number;
  rawDataLength: number;
  metadataPosition: number;
  metadataLength: number;
  messageSizes: {
    [command: number]: number;
  };
};

export function openSlpFile(ref: SlpInputRef): SlpFileType {
  ref.open();
  const rawDataPosition = getRawDataPosition(ref);
  const rawDataLength = getRawDataLength(ref, rawDataPosition);
  const metadataPosition = rawDataPosition + rawDataLength + 10; // remove metadata string
  const metadataLength = getMetadataLength(ref, metadataPosition);
  const messageSizes = getMessageSizes(ref, rawDataPosition);

  return {
    ref,
    rawDataPosition,
    rawDataLength,
    metadataPosition,
    metadataLength,
    messageSizes,
  };
}

// This function gets the position where the raw data starts
function getRawDataPosition(ref: SlpInputRef): number {
  const buffer = new Uint8Array(1);
  ref.read(buffer, 0, buffer.length, 0);

  if (buffer[0] === 0x36) {
    return 0;
  }

  if (buffer[0] !== "{".charCodeAt(0)) {
    return 0; // return error?
  }

  return 15;
}

function getRawDataLength(ref: SlpInputRef, position: number): number {
  const fileSize = ref.size();
  if (position === 0) {
    return fileSize;
  }

  const buffer = new Uint8Array(4);
  ref.read(buffer, 0, buffer.length, position - 4);

  const rawDataLen = (buffer[0]! << 24) | (buffer[1]! << 16) | (buffer[2]! << 8) | buffer[3]!;
  if (rawDataLen > 0) {
    // If this method manages to read a number, it's probably trustworthy
    return rawDataLen;
  }

  // If the above does not return a valid data length,
  // return a file size based on file length. This enables
  // some support for severed files
  return fileSize - position;
}

function getMetadataLength(ref: SlpInputRef, position: number): number {
  const len = ref.size();
  return len - position - 1;
}

function getMessageSizes(
  ref: SlpInputRef,
  position: number,
): {
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
  ref.read(buffer, 0, buffer.length, position);
  if (buffer[0] !== Command.MESSAGE_SIZES) {
    return {};
  }

  const payloadLength = buffer[1] as number;
  (messageSizes[0x35] as any) = payloadLength;

  const messageSizesBuffer = new Uint8Array(payloadLength - 1);
  ref.read(messageSizesBuffer, 0, messageSizesBuffer.length, position + 2);
  for (let i = 0; i < payloadLength - 1; i += 3) {
    const command = messageSizesBuffer[i] as number;

    // Get size of command
    (messageSizes[command] as any) = (messageSizesBuffer[i + 1]! << 8) | messageSizesBuffer[i + 2]!;
  }

  return messageSizes;
}

function getEnabledItems(view: DataView): number {
  const offsets = [0x1, 0x100, 0x10000, 0x1000000, 0x100000000];
  const enabledItems = offsets.reduce((acc, byteOffset, index) => {
    const byte = readUint8(view, 0x28 + index) as number;
    return acc + byte * byteOffset;
  }, 0);

  return enabledItems;
}

function getGameInfoBlock(view: DataView): GameInfoType {
  const offset = 0x5;

  return {
    gameBitfield1: readUint8(view, 0x0 + offset),
    gameBitfield2: readUint8(view, 0x1 + offset),
    gameBitfield3: readUint8(view, 0x2 + offset),
    gameBitfield4: readUint8(view, 0x3 + offset),
    bombRainEnabled: (readUint8(view, 0x6 + offset)! & 0xff) > 0 ? true : false,
    selfDestructScoreValue: readInt8(view, 0xc + offset),
    itemSpawnBitfield1: readUint8(view, 0x23 + offset),
    itemSpawnBitfield2: readUint8(view, 0x24 + offset),
    itemSpawnBitfield3: readUint8(view, 0x25 + offset),
    itemSpawnBitfield4: readUint8(view, 0x26 + offset),
    itemSpawnBitfield5: readUint8(view, 0x27 + offset),
    damageRatio: readFloat(view, 0x30 + offset),
  };
}

/**
 * Iterates through slp events and parses payloads
 */
export function iterateEvents(
  slpFile: SlpFileType,
  callback: EventCallbackFunc,
  startPos: number | null = null,
): number {
  const ref = slpFile.ref;

  let readPosition = startPos !== null && startPos > 0 ? startPos : slpFile.rawDataPosition;
  const stopReadingAt = slpFile.rawDataPosition + slpFile.rawDataLength;

  // Generate read buffers for each
  const commandPayloadBuffers = mapValues(slpFile.messageSizes, (size) => new Uint8Array(size + 1));
  let splitMessageBuffer = new Uint8Array(0);

  const commandByteBuffer = new Uint8Array(1);
  while (readPosition < stopReadingAt) {
    ref.read(commandByteBuffer, 0, 1, readPosition);
    let commandByte = (commandByteBuffer[0] as number) ?? 0;
    let buffer = commandPayloadBuffers[commandByte];
    if (buffer === undefined) {
      // If we don't have an entry for this command, return false to indicate failed read
      return readPosition;
    }

    if (buffer.length > stopReadingAt - readPosition) {
      return readPosition;
    }

    const advanceAmount = buffer.length;

    ref.read(buffer, 0, buffer.length, readPosition);
    if (commandByte === Command.SPLIT_MESSAGE) {
      // Here we have a split message, we will collect data from them until the last
      // message of the list is received
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const size = readUint16(view, 0x201) ?? 512;
      const isLastMessage = readBool(view, 0x204);
      const internalCommand = readUint8(view, 0x203) ?? 0;

      // If this is the first message, initialize the splitMessageBuffer
      // with the internal command byte because our parseMessage function
      // seems to expect a command byte at the start
      if (splitMessageBuffer.length === 0) {
        splitMessageBuffer = new Uint8Array(1);
        splitMessageBuffer[0] = internalCommand;
      }

      // Collect new data into splitMessageBuffer
      const appendBuf = buffer.subarray(0x1, 0x1 + size);
      const mergedBuf = new Uint8Array(splitMessageBuffer.length + appendBuf.length);
      mergedBuf.set(splitMessageBuffer);
      mergedBuf.set(appendBuf, splitMessageBuffer.length);
      splitMessageBuffer = mergedBuf;

      if (isLastMessage) {
        commandByte = splitMessageBuffer[0] ?? 0;
        buffer = splitMessageBuffer;
        splitMessageBuffer = new Uint8Array(0);
      }
    }

    const parsedPayload = parseMessage(commandByte, buffer);
    const shouldStop = callback(commandByte, parsedPayload, buffer);
    if (shouldStop) {
      break;
    }

    readPosition += advanceAmount;
  }

  return readPosition;
}

export function parseMessage(command: Command, payload: Uint8Array): EventPayloadTypes | null {
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  switch (command) {
    case Command.GAME_START:
      const getPlayerObject = (playerIndex: number): PlayerType => {
        // Controller Fix stuff
        const cfOffset = playerIndex * 0x8;
        const dashback = readUint32(view, 0x141 + cfOffset);
        const shieldDrop = readUint32(view, 0x145 + cfOffset);
        let controllerFix = "None";
        if (dashback !== shieldDrop) {
          controllerFix = "Mixed";
        } else if (dashback === 1) {
          controllerFix = "UCF";
        } else if (dashback === 2) {
          controllerFix = "Dween";
        }

        // Nametag stuff
        const nametagLength = 0x10;
        const nametagOffset = playerIndex * nametagLength;
        const nametagStart = 0x161 + nametagOffset;
        const nametagBuf = payload.subarray(nametagStart, nametagStart + nametagLength);
        const nameTagString = decodeSJIS(nametagBuf).split("\0").shift();
        const nametag = nameTagString ? toHalfwidth(nameTagString) : "";

        // Display name
        const displayNameLength = 0x1f;
        const displayNameOffset = playerIndex * displayNameLength;
        const displayNameStart = 0x1a5 + displayNameOffset;
        const displayNameBuf = payload.subarray(displayNameStart, displayNameStart + displayNameLength);
        const displayNameString = decodeSJIS(displayNameBuf).split("\0").shift();
        const displayName = displayNameString ? toHalfwidth(displayNameString) : "";

        // Connect code
        const connectCodeLength = 0xa;
        const connectCodeOffset = playerIndex * connectCodeLength;
        const connectCodeStart = 0x221 + connectCodeOffset;
        const connectCodeBuf = payload.subarray(connectCodeStart, connectCodeStart + connectCodeLength);
        const connectCodeString = decodeSJIS(connectCodeBuf).split("\0").shift();
        const connectCode = connectCodeString ? toHalfwidth(connectCodeString) : "";

        const userIdLength = 0x1d;
        const userIdOffset = playerIndex * userIdLength;
        const userIdStart = 0x249 + userIdOffset;
        const userIdBuf = payload.subarray(userIdStart, userIdStart + userIdLength);
        const userIdString = utf8Decoder.decode(userIdBuf).split("\0").shift();
        const userId = userIdString ?? "";

        const offset = playerIndex * 0x24;
        const playerInfo: PlayerType = {
          playerIndex,
          port: playerIndex + 1,
          characterId: readUint8(view, 0x65 + offset),
          type: readUint8(view, 0x66 + offset),
          startStocks: readUint8(view, 0x67 + offset),
          characterColor: readUint8(view, 0x68 + offset),
          teamShade: readUint8(view, 0x6c + offset),
          handicap: readUint8(view, 0x6d + offset),
          teamId: readUint8(view, 0x6e + offset),
          staminaMode: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x01)),
          silentCharacter: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x02)),
          lowGravity: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x04)),
          invisible: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x08)),
          blackStockIcon: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x10)),
          metal: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x20)),
          startOnAngelPlatform: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x40)),
          rumbleEnabled: Boolean(readUint8(view, 0x6c + playerIndex * 0x24, 0x80)),
          cpuLevel: readUint8(view, 0x74 + offset),
          offenseRatio: readFloat(view, 0x7d + offset),
          defenseRatio: readFloat(view, 0x81 + offset),
          modelScale: readFloat(view, 0x85 + offset),
          controllerFix,
          nametag,
          displayName,
          connectCode,
          userId,
        };
        return playerInfo;
      };

      const sessionIdLength = 51;
      const sessionIdStart = 0x2be;
      const sessionIdBuf = payload.subarray(sessionIdStart, sessionIdStart + sessionIdLength);
      const sessionIdString = utf8Decoder.decode(sessionIdBuf).split("\0").shift();
      const sessionId = sessionIdString ?? "";

      const gameSettings: GameStartType = {
        slpVersion: `${readUint8(view, 0x1)}.${readUint8(view, 0x2)}.${readUint8(view, 0x3)}`,
        timerType: readUint8(view, 0x5, 0x03),
        inGameMode: readUint8(view, 0x5, 0xe0),
        friendlyFireEnabled: !!readUint8(view, 0x6, 0x01),
        isTeams: readBool(view, 0xd),
        itemSpawnBehavior: readUint8(view, 0x10),
        stageId: readUint16(view, 0x13),
        startingTimerSeconds: readUint32(view, 0x15),
        enabledItems: getEnabledItems(view),
        players: [0, 1, 2, 3].map(getPlayerObject),
        scene: readUint8(view, 0x1a3),
        gameMode: readUint8(view, 0x1a4),
        language: readUint8(view, 0x2bd),
        gameInfoBlock: getGameInfoBlock(view),
        randomSeed: readUint32(view, 0x13d),
        isPAL: readBool(view, 0x1a1),
        isFrozenPS: readBool(view, 0x1a2),
        matchInfo: {
          sessionId: sessionId,
          gameNumber: readUint32(view, 0x2f1),
          tiebreakerNumber: readUint32(view, 0x2f5),
          /** remove in v8 */
          matchId: sessionId,
        },
      };
      return gameSettings;
    case Command.FRAME_START:
      return {
        frame: readInt32(view, 0x1),
        seed: readUint32(view, 0x5),
        sceneFrameCounter: readUint32(view, 0x9),
      };

    case Command.PRE_FRAME_UPDATE:
      return {
        frame: readInt32(view, 0x1),
        playerIndex: readUint8(view, 0x5),
        isFollower: readBool(view, 0x6),
        seed: readUint32(view, 0x7),
        actionStateId: readUint16(view, 0xb),
        positionX: readFloat(view, 0xd),
        positionY: readFloat(view, 0x11),
        facingDirection: readFloat(view, 0x15),
        joystickX: readFloat(view, 0x19),
        joystickY: readFloat(view, 0x1d),
        cStickX: readFloat(view, 0x21),
        cStickY: readFloat(view, 0x25),
        trigger: readFloat(view, 0x29),
        buttons: readUint32(view, 0x2d),
        physicalButtons: readUint16(view, 0x31),
        physicalLTrigger: readFloat(view, 0x33),
        physicalRTrigger: readFloat(view, 0x37),
        rawJoystickX: readInt8(view, 0x3b),
        percent: readFloat(view, 0x3c),
      };
    case Command.POST_FRAME_UPDATE:
      const selfInducedSpeeds: SelfInducedSpeedsType = {
        airX: readFloat(view, 0x35),
        y: readFloat(view, 0x39),
        attackX: readFloat(view, 0x3d),
        attackY: readFloat(view, 0x41),
        groundX: readFloat(view, 0x45),
      };
      return {
        frame: readInt32(view, 0x1),
        playerIndex: readUint8(view, 0x5),
        isFollower: readBool(view, 0x6),
        internalCharacterId: readUint8(view, 0x7),
        actionStateId: readUint16(view, 0x8),
        positionX: readFloat(view, 0xa),
        positionY: readFloat(view, 0xe),
        facingDirection: readFloat(view, 0x12),
        percent: readFloat(view, 0x16),
        shieldSize: readFloat(view, 0x1a),
        lastAttackLanded: readUint8(view, 0x1e),
        currentComboCount: readUint8(view, 0x1f),
        lastHitBy: readUint8(view, 0x20),
        stocksRemaining: readUint8(view, 0x21),
        actionStateCounter: readFloat(view, 0x22),
        miscActionState: readFloat(view, 0x2b),
        isAirborne: readBool(view, 0x2f),
        lastGroundId: readUint16(view, 0x30),
        jumpsRemaining: readUint8(view, 0x32),
        lCancelStatus: readUint8(view, 0x33),
        hurtboxCollisionState: readUint8(view, 0x34),
        selfInducedSpeeds: selfInducedSpeeds,
        hitlagRemaining: readFloat(view, 0x49),
        animationIndex: readUint32(view, 0x4d),
        instanceHitBy: readUint16(view, 0x51),
        instanceId: readUint16(view, 0x53),
      };
    case Command.ITEM_UPDATE:
      return {
        frame: readInt32(view, 0x1),
        typeId: readUint16(view, 0x5),
        state: readUint8(view, 0x7),
        facingDirection: readFloat(view, 0x8),
        velocityX: readFloat(view, 0xc),
        velocityY: readFloat(view, 0x10),
        positionX: readFloat(view, 0x14),
        positionY: readFloat(view, 0x18),
        damageTaken: readUint16(view, 0x1c),
        expirationTimer: readFloat(view, 0x1e),
        spawnId: readUint32(view, 0x22),
        missileType: readUint8(view, 0x26),
        turnipFace: readUint8(view, 0x27),
        chargeShotLaunched: readUint8(view, 0x28),
        chargePower: readUint8(view, 0x29),
        owner: readInt8(view, 0x2a),
        instanceId: readUint16(view, 0x2b),
      };
    case Command.FRAME_BOOKEND:
      return {
        frame: readInt32(view, 0x1),
        latestFinalizedFrame: readInt32(view, 0x5),
      };
    case Command.GAME_END:
      const placements = [0, 1, 2, 3].map((playerIndex): PlacementType => {
        const position = readInt8(view, 0x3 + playerIndex);
        return { playerIndex, position };
      });

      return {
        gameEndMethod: readUint8(view, 0x1),
        lrasInitiatorIndex: readInt8(view, 0x2),
        placements,
      };
    case Command.GECKO_LIST:
      const codes: GeckoCodeType[] = [];
      let pos = 1;
      while (pos < payload.length) {
        const word1 = readUint32(view, pos) ?? 0;
        const codetype = (word1 >> 24) & 0xfe;
        const address = (word1 & 0x01ffffff) + 0x80000000;

        let offset = 8; // Default code length, most codes are this length
        if (codetype === 0xc0 || codetype === 0xc2) {
          const lineCount = readUint32(view, pos + 4) ?? 0;
          offset = 8 + lineCount * 8;
        } else if (codetype === 0x06) {
          const byteLen = readUint32(view, pos + 4) ?? 0;
          offset = 8 + ((byteLen + 7) & 0xfffffff8);
        } else if (codetype === 0x08) {
          offset = 16;
        }

        codes.push({
          type: codetype,
          address: address,
          contents: payload.subarray(pos, pos + offset),
        });

        pos += offset;
      }

      return {
        contents: payload.subarray(1),
        codes: codes,
      };
    case Command.FOD_PLATFORM:
      return {
        frame: readInt32(view, 0x1),
        platform: readInt8(view, 0x5),
        height: readFloat(view, 0x6),
      };
    case Command.WHISPY:
      return {
        frame: readInt32(view, 0x1),
        direction: readInt8(view, 0x5),
      };
    case Command.STADIUM_TRANSFORMATION:
      return {
        frame: readInt32(view, 0x1),
        event: readUint16(view, 0x5),
        transformation: readUint16(view, 0x7),
      };
    default:
      return null;
  }
}

function canReadFromView(view: DataView, offset: number, length: number): boolean {
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

function readUint8(view: DataView, offset: number, bitmask = 0xff): number | null {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return view.getUint8(offset) & bitmask;
}

function readBool(view: DataView, offset: number): boolean | null {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return !!view.getUint8(offset);
}

export function getMetadata(slpFile: SlpFileType): MetadataType | null {
  if (slpFile.metadataLength <= 0) {
    // This will happen on a severed incomplete file
    // $FlowFixMe
    return null;
  }

  const buffer = new Uint8Array(slpFile.metadataLength);

  slpFile.ref.read(buffer, 0, buffer.length, slpFile.metadataPosition);

  let metadata = null;
  try {
    metadata = decodeUBJSON(buffer.buffer);
  } catch (ex) {
    // Do nothing
    // console.log(ex);
  }

  // $FlowFixMe
  return metadata;
}

export function getGameEnd(slpFile: SlpFileType): GameEndType | null {
  const { ref, rawDataPosition, rawDataLength, messageSizes } = slpFile;
  const gameEndPayloadSize = messageSizes[Command.GAME_END];
  if (!exists(gameEndPayloadSize) || gameEndPayloadSize <= 0) {
    return null;
  }

  // Add one to account for command byte
  const gameEndSize = gameEndPayloadSize + 1;
  const gameEndPosition = rawDataPosition + rawDataLength - gameEndSize;

  const buffer = new Uint8Array(gameEndSize);
  ref.read(buffer, 0, buffer.length, gameEndPosition);
  if (buffer[0] !== Command.GAME_END) {
    // This isn't even a game end payload
    return null;
  }

  const gameEndMessage = parseMessage(Command.GAME_END, buffer);
  if (!gameEndMessage) {
    return null;
  }

  return gameEndMessage as GameEndType;
}

export function extractFinalPostFrameUpdates(slpFile: SlpFileType): PostFrameUpdateType[] {
  const { ref, rawDataPosition, rawDataLength, messageSizes } = slpFile;

  // The following should exist on all replay versions
  const postFramePayloadSize = messageSizes[Command.POST_FRAME_UPDATE];
  const gameEndPayloadSize = messageSizes[Command.GAME_END];
  const frameBookendPayloadSize = messageSizes[Command.FRAME_BOOKEND];

  // Technically this should not be possible
  if (!exists(postFramePayloadSize)) {
    return [];
  }

  const gameEndSize = gameEndPayloadSize ? gameEndPayloadSize + 1 : 0;
  const postFrameSize = postFramePayloadSize + 1;
  const frameBookendSize = frameBookendPayloadSize ? frameBookendPayloadSize + 1 : 0;

  let frameNum: number | null = null;
  let postFramePosition = rawDataPosition + rawDataLength - gameEndSize - frameBookendSize - postFrameSize;
  const postFrameUpdates: PostFrameUpdateType[] = [];
  do {
    const buffer = new Uint8Array(postFrameSize);
    ref.read(buffer, 0, buffer.length, postFramePosition);
    if (buffer[0] !== Command.POST_FRAME_UPDATE) {
      break;
    }

    const postFrameMessage = parseMessage(Command.POST_FRAME_UPDATE, buffer) as PostFrameUpdateType | null;
    if (!postFrameMessage) {
      break;
    }

    if (frameNum === null) {
      frameNum = postFrameMessage.frame;
    } else if (frameNum !== postFrameMessage.frame) {
      // If post frame message is found but the frame doesn't match, it's not part of the final frame
      break;
    }

    postFrameUpdates.unshift(postFrameMessage);
    postFramePosition -= postFrameSize;
  } while (postFramePosition >= rawDataPosition);

  return postFrameUpdates;
}

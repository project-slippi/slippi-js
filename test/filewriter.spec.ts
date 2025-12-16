import fs from "fs";
import { Writable } from "stream";

import { SlpFileWriter, SlippiGame, SlpFileWriterEvent } from "../src/node/index";
import { openSlpFile } from "../src/common/utils/slpReader";
import { SlpFileInputRef } from "../src/node/utils/slpFileInputRef";

describe("when ending SlpFileWriter", () => {
  it("should write data length to file", async () => {
    const { dataLength, fileCompletePromise, newFilename } = runSlpFileWriter("slp/finalizedFrame.slp");
    await fileCompletePromise;

    const writtenDataLength = openSlpFile(new SlpFileInputRef(newFilename)).rawDataLength;
    fs.unlinkSync(newFilename);

    expect(writtenDataLength).toBe(dataLength);
  });

  it("should succeed if no display names or connect codes are available in game start", async () => {
    const { fileCompletePromise, newFilename } = runSlpFileWriter("slp/finalizedFrame.slp");

    await fileCompletePromise;

    const metadata = new SlippiGame(newFilename).getMetadata();
    const players = metadata?.players;
    expect(players).toBeDefined();
    const playerNames: any = {};
    Object.keys(players!).forEach((key) => {
      const player = players![key];
      playerNames[key] = player.names;
    });
    fs.unlinkSync(newFilename);

    expect(playerNames).toEqual({ 0: { netplay: "", code: "" }, 1: { netplay: "", code: "" } });
  });

  it("should write display name and connect codes to metadata if available in game start", async () => {
    const { fileCompletePromise, newFilename } = runSlpFileWriter("slp/displayNameAndConnectCodeInGameStart.slp");

    await fileCompletePromise;

    const metadata = new SlippiGame(newFilename).getMetadata();
    const players = metadata?.players;
    expect(players).toBeDefined();
    const playerNames: any = {};
    Object.keys(players!).forEach((key) => {
      const player = players![key];
      playerNames[key] = player.names;
    });
    fs.unlinkSync(newFilename);

    expect(playerNames).toEqual({
      0: { netplay: "ekans", code: "EKNS#442" },
      1: { netplay: "gaR's uncle", code: "BAP#666" },
      2: { netplay: "jmlee337", code: "JMLE#166" },
      3: { netplay: "Mr.SuiSui", code: "SUI#244" },
    });
  });
});

const runSlpFileWriter = function (testFilePath: string): {
  dataLength: number;
  newFilename: string;
  fileCompletePromise: Promise<void>;
} {
  const slpFileWriter = new SlpFileWriter();
  const ref = new SlpFileInputRef(testFilePath);
  const slpFile = openSlpFile(ref);
  const dataLength = slpFile.rawDataLength;
  const dataPos = slpFile.rawDataPosition;

  // Set up the FILE_COMPLETE promise BEFORE piping any data
  // FILE_COMPLETE now fires after the file's "finish" event, so we can use it directly
  const fileCompletePromise = new Promise<void>((resolve) => {
    slpFileWriter.once(SlpFileWriterEvent.FILE_COMPLETE, () => {
      resolve();
    });
  });

  const testFd = fs.openSync(testFilePath, "r");
  const newPos = pipeMessageSizes(testFd, dataPos, slpFileWriter);

  const newFilename = slpFileWriter.getCurrentFilename();
  if (!newFilename) {
    throw new Error("Failed to get filename from SlpFileWriter");
  }

  pipeAllEvents(testFd, newPos, dataPos + dataLength, slpFileWriter, slpFile.messageSizes);

  return {
    dataLength: dataLength,
    newFilename: newFilename,
    fileCompletePromise: fileCompletePromise,
  };
};

const pipeMessageSizes = function (fd: number, start: number, writeStream: Writable): number {
  let pos = start;
  const commandByteBuffer = new Uint8Array(2);
  fs.readSync(fd, commandByteBuffer, 0, 2, pos);
  const length = commandByteBuffer[1] + 1;

  const buffer = new Uint8Array(length);
  fs.readSync(fd, buffer, 0, length, pos);

  pos += length;
  writeStream.write(buffer);

  return pos;
};

const pipeAllEvents = function (
  fd: number,
  start: number,
  end: number,
  writeStream: Writable,
  messageSizes: {
    [command: number]: number;
  },
) {
  let pos = start;
  while (pos < end) {
    const commandByteBuffer = new Uint8Array(1);
    fs.readSync(fd, commandByteBuffer, 0, 1, pos);
    const length = messageSizes[commandByteBuffer[0]] + 1;
    // const commandByte = commandByteBuffer[0];

    const buffer = new Uint8Array(length);
    fs.readSync(fd, buffer, 0, length, pos);

    pos += length;
    writeStream.write(buffer);
  }
};

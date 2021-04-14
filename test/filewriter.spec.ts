import fs from "fs";
import { openSlpFile, SlpInputSource } from "../src/utils/slpReader";
import { SlpFileWriter, SlippiGame } from "../src";
import { Writable } from "stream";

// On my machine, >100 is required to give the slpFile.ts "finish" callback time to execute.
// I thought a 'yield' 0 ms setTimout would allow the callback to execute, but that's not the case.
const TIMEOUT_MS = 1000;

describe("when ending SlpFileWriter", () => {
  it("should write data length to file", async () => {
    const { dataLength, newFilename } = runSlpFileWriter("slp/finalizedFrame.slp");
    await new Promise((resolve) => {
      setTimeout(() => {
        const writtenDataLength = openSlpFile({ source: SlpInputSource.FILE, filePath: newFilename }).rawDataLength;
        fs.unlinkSync(newFilename);

        expect(writtenDataLength).toBe(dataLength);

        resolve();
      }, TIMEOUT_MS);
    });
  });

  it("should succeed if no display names or connect codes are available in game start", async () => {
    const { newFilename } = runSlpFileWriter("slp/finalizedFrame.slp");
    await new Promise((resolve) => {
      setTimeout(() => {
        const players = new SlippiGame(newFilename).getMetadata().players;
        Object.keys(players).forEach((key) => {
          const player = players[key];
          players[key] = player.names;
        });
        fs.unlinkSync(newFilename);

        expect(players).toEqual({ 0: { netplay: "", code: "" }, 1: { netplay: "", code: "" } });

        resolve();
      }, TIMEOUT_MS);
    });
  });

  it("should write display name and connect codes to metadata if available in game start", async () => {
    const { newFilename } = runSlpFileWriter("slp/displayNameAndConnectCodeInGameStart.slp");
    await new Promise((resolve) => {
      setTimeout(() => {
        const players = new SlippiGame(newFilename).getMetadata().players;
        Object.keys(players).forEach((key) => {
          const player = players[key];
          players[key] = player.names;
        });
        fs.unlinkSync(newFilename);

        expect(players).toEqual({
          0: { netplay: "ekans", code: "EKNS#442" },
          1: { netplay: "gaR's uncle", code: "BAP#666" },
          2: { netplay: "jmlee337", code: "JMLE#166" },
          3: { netplay: "Mr.SuiSui", code: "SUI#244" },
        });

        resolve();
      }, TIMEOUT_MS);
    });
  });
});

const runSlpFileWriter = function (testFilePath: string): { dataLength: number; newFilename: string } {
  const slpFileWriter = new SlpFileWriter();
  const slpFile = openSlpFile({ source: SlpInputSource.FILE, filePath: testFilePath });
  const dataLength = slpFile.rawDataLength;
  const dataPos = slpFile.rawDataPosition;

  const testFd = fs.openSync(testFilePath, "r");
  const newPos = pipeMessageSizes(testFd, dataPos, slpFileWriter);

  const newFilename = slpFileWriter.getCurrentFilename();

  pipeAllEvents(testFd, newPos, dataPos + dataLength, slpFileWriter, slpFile.messageSizes);

  return {
    dataLength: dataLength,
    newFilename: newFilename,
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
    const commandByte = commandByteBuffer[0];

    const buffer = new Uint8Array(length);
    fs.readSync(fd, buffer, 0, length, pos);

    pos += length;
    writeStream.write(buffer);
  }
};

import fs from "fs";
import { openSlpFile, SlpInputSource } from "../src/utils/slpReader";
import { SlpFileWriter } from "../src";
import { Writable } from "stream";

describe("when ending SlpFileWriter", () => {
  it("should write data length to file", async () => {
    const testFilePath = "slp/finalizedFrame.slp";

    const slpFileWriter = new SlpFileWriter();
    const slpFile = openSlpFile({ source: SlpInputSource.FILE, filePath: testFilePath });
    const dataLength = slpFile.rawDataLength;
    const dataPos = slpFile.rawDataPosition;

    const testFd = fs.openSync(testFilePath, "r");
    const newPos = pipeMessageSizes(testFd, dataPos, slpFileWriter);
    const newFilename = slpFileWriter.getCurrentFilename();

    pipeAllEvents(testFd, newPos, dataPos + dataLength, slpFileWriter, slpFile.messageSizes);
    await new Promise((resolve): void => {
      // On my machine, >100 is required to give the slpFile.ts "finish" callback time to execute.
      // I thought a 'yield' 0 ms setTimout would allow the callback to execute, but that's not the case.
      const timeoutMs = 1000;

      setTimeout(() => {
        const writtenDataLength = openSlpFile({ source: SlpInputSource.FILE, filePath: newFilename }).rawDataLength;
        fs.unlinkSync(newFilename);

        expect(writtenDataLength).toBe(dataLength);

        resolve();
      }, timeoutMs);
    });
  });
});

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
): void {
  let pos = start;
  while (pos < end) {
    const commandByteBuffer = new Uint8Array(1);
    fs.readSync(fd, commandByteBuffer, 0, 1, pos);
    const length = messageSizes[commandByteBuffer[0]] + 1;

    const buffer = new Uint8Array(length);
    fs.readSync(fd, buffer, 0, length, pos);

    pos += length;
    writeStream.write(buffer);
  }
};

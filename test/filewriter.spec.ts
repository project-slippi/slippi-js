import fs from "fs";
import { openSlpFile, SlpInputSource } from "../src/utils/slpReader";
import { SlpFileWriter } from "../src";
import { Writable } from "stream";

describe("when ending SlpFileWriter", () => {
  it("should write payload length to file", async () => {
    const testFilePath = "slp/finalizedFrame.slp";

    const slpFileWriter = new SlpFileWriter();
    const slpFile = openSlpFile({ source: SlpInputSource.FILE, filePath: testFilePath });
    const dataPos = slpFile.rawDataPosition;

    const testFd = fs.openSync(testFilePath, "r");
    const newPos = pipeMessageSizes(testFd, dataPos, slpFileWriter);

    const newFilename = slpFileWriter.getCurrentFilename();
    const buffer = Buffer.alloc(4);

    pipeAllEvents(testFd, newPos, dataPos + slpFile.rawDataLength, slpFileWriter, slpFile.messageSizes);
    await new Promise((resolve) => {
      // On my machine, >100 is required to give the slpFile.ts "finish" callback time to execute.
      // I thought a 'yield' 0 ms setTimout would allow the callback to execute, but that's not the case.
      const timeoutMs = 1000;

      setTimeout(() => {
        debugger;
        const fd = fs.openSync(newFilename, "r");
        fs.readSync(fd, buffer, 0, 4, 11);
        fs.closeSync(testFd);
        fs.closeSync(fd);
        fs.unlinkSync(newFilename);

        // The expected value may change if slp/finalizedFrame.slp changes but otherwise it should not.
        expect(buffer.readUInt32BE(0)).toBe(5218007);

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

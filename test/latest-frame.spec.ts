import fs from 'fs';
import { Writable } from 'stream';

import SlippiGame, {
  Command,
  SlpStreamMode,
  SlpStream,
  Frames,
  SlpCommandEventPayload,
  SlpStreamEvent,
  FrameBookendType,
  SlpParser,
  SlpParserEvent,
  FrameEntryType,
} from '../src';

const MAX_ROLLBACK_FRAMES = 7;

describe('when reading last finalised frame from SlpStream', () => {
  it('should never decrease', async () => {
    const testFile = 'slp/finalizedFrame.slp';
    const stream = new SlpStream({
      mode: SlpStreamMode.MANUAL,
    });

    let lastFinalizedFrame = Frames.FIRST - 1;

    stream.on(SlpStreamEvent.COMMAND, (data: SlpCommandEventPayload) => {
      switch (data.command) {
        case Command.FRAME_BOOKEND:
          const payload = data.payload as FrameBookendType;
          // We should never have the latest finalized frame be less than the first frame
          expect(payload.latestFinalizedFrame).not.toEqual(Frames.FIRST - 1);
          expect(payload.latestFinalizedFrame).toBeGreaterThanOrEqual(lastFinalizedFrame);
          // We also expect it to be within 7 frames of the current frame
          expect(payload.latestFinalizedFrame).toBeGreaterThanOrEqual(payload.frame - MAX_ROLLBACK_FRAMES);
          lastFinalizedFrame = payload.latestFinalizedFrame;
      }
    });
    await pipeFileContents(testFile, stream);

    // The last finalized frame should be the same as what's recorded in the metadata
    const game = new SlippiGame(testFile);
    const metadata = game.getMetadata();
    expect(metadata.lastFrame).toEqual(lastFinalizedFrame);
  });
});

describe('when reading finalised frames from SlpParser', () => {
  it('should only increase', async () => {
    const testFile = 'slp/finalizedFrame.slp';
    const stream = new SlpStream({
      mode: SlpStreamMode.MANUAL,
    });
    const parser = new SlpParser();

    let lastFinalizedFrame = Frames.FIRST - 1;

    // Check the finalized frames to ensure they're increasing
    parser.on(SlpParserEvent.FINALIZED_FRAME, (frameEntry: FrameEntryType) => {
      const { frame } = frameEntry;
      // We should never receive the same frame twice
      expect(frame).not.toEqual(lastFinalizedFrame);
      // The frame should monotonically increase
      expect(frame).toEqual(lastFinalizedFrame + 1);
      lastFinalizedFrame = frame;
    });

    // Forward all the commands to the parser
    stream.on(SlpStreamEvent.COMMAND, (data: SlpCommandEventPayload) => {
      parser.handleCommand(data.command, data.payload);
    });

    await pipeFileContents(testFile, stream);

    // The last finalized frame should be the same as what's recorded in the metadata
    const game = new SlippiGame(testFile);
    const metadata = game.getMetadata();
    expect(metadata.lastFrame).toEqual(lastFinalizedFrame);
  });
});

const pipeFileContents = async (filename: string, destination: Writable, options?: any): Promise<void> => {
  return new Promise((resolve): void => {
    const readStream = fs.createReadStream(filename);
    readStream.on('open', () => {
      readStream.pipe(destination, options);
    });
    readStream.on('close', () => {
      resolve();
    });
  });
};

import fs from 'fs';
import { Writable } from 'stream';

export const pipeFileContents = async (filename: string, destination: Writable, options?: any): Promise<void> => {
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

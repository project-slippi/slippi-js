import { forEach } from 'lodash';
import fs, { WriteStream } from 'fs';
import moment, { Moment } from 'moment';
import { Writable, WritableOptions } from 'stream';

const DEFAULT_NICKNAME = 'unknown';

export interface SlpFileMetadata {
  startTime: Moment;
  lastFrame: number;
  players: any;
  consoleNickname?: string;
}

/**
 * SlpFile is a class that wraps a Writable stream. It handles the writing of the binary
 * header and footer, and also handles the overwriting of the raw data length.
 *
 * @class SlpFile
 * @extends {Writable}
 */
export class SlpFile extends Writable {
  private filePath: string;
  private metadata: SlpFileMetadata;
  private fileStream: WriteStream;
  private rawDataLength = 0;

  /**
   * Creates an instance of SlpFile.
   * @param {string} filePath The file location to write to.
   * @param {WritableOptions} [opts] Options for writing.
   * @memberof SlpFile
   */
  public constructor(filePath: string, opts?: WritableOptions) {
    super(opts);
    this.filePath = filePath;
    this.metadata = {
      consoleNickname: DEFAULT_NICKNAME,
      startTime: moment(),
      lastFrame: -124,
      players: {},
    };

    this._initializeNewGame(this.filePath);
    this.on('finish', () => {
      // Write bytes written
      const fd = fs.openSync(this.filePath, 'r+');
      (fs as any).writeSync(fd, createUInt32Buffer(this.rawDataLength), 0, 'binary', 11);
      fs.closeSync(fd);
    });
  }

  /**
   * Get the current file path being written to.
   *
   * @returns {string} The location of the current file path
   * @memberof SlpFile
   */
  public path(): string {
    return this.filePath;
  }

  /**
   * Sets the metadata of the Slippi file, such as consoleNickname, lastFrame, and players.
   *
   * @param {SlpFileMetadata} metadata The metadata to be written
   * @memberof SlpFile
   */
  public setMetadata(metadata: SlpFileMetadata): void {
    this.metadata = metadata;
  }

  public _write(chunk: Uint8Array, encoding: string, callback: (error?: Error | null) => void): void {
    if (encoding !== 'buffer') {
      throw new Error(`Unsupported stream encoding. Expected 'buffer' got '${encoding}'.`);
    }
    this.fileStream.write(chunk);
    this.rawDataLength += chunk.length;
    callback();
  }

  private _initializeNewGame(filePath: string): void {
    this.fileStream = fs.createWriteStream(filePath, {
      encoding: 'binary',
    });

    const header = Buffer.concat([
      Buffer.from('{U'),
      Buffer.from([3]),
      Buffer.from('raw[$U#l'),
      Buffer.from([0, 0, 0, 0]),
    ]);
    this.fileStream.write(header);
  }

  public _final(callback: (error?: Error | null) => void): void {
    let footer = Buffer.concat([Buffer.from('U'), Buffer.from([8]), Buffer.from('metadata{')]);

    // Write game start time
    const startTimeStr = this.metadata.startTime.toISOString();
    footer = Buffer.concat([
      footer,
      Buffer.from('U'),
      Buffer.from([7]),
      Buffer.from('startAtSU'),
      Buffer.from([startTimeStr.length]),
      Buffer.from(startTimeStr),
    ]);

    // Write last frame index
    // TODO: Get last frame
    const lastFrame = this.metadata.lastFrame;
    footer = Buffer.concat([
      footer,
      Buffer.from('U'),
      Buffer.from([9]),
      Buffer.from('lastFramel'),
      createInt32Buffer(lastFrame),
    ]);

    // write the Console Nickname
    const consoleNick = this.metadata.consoleNickname || DEFAULT_NICKNAME;
    footer = Buffer.concat([
      footer,
      Buffer.from('U'),
      Buffer.from([11]),
      Buffer.from('consoleNickSU'),
      Buffer.from([consoleNick.length]),
      Buffer.from(consoleNick),
    ]);

    // Start writting player specific data
    footer = Buffer.concat([footer, Buffer.from('U'), Buffer.from([7]), Buffer.from('players{')]);
    const players = this.metadata.players;
    forEach(players, (player, index) => {
      // Start player obj with index being the player index
      footer = Buffer.concat([footer, Buffer.from('U'), Buffer.from([index.length]), Buffer.from(`${index}{`)]);

      // Start characters key for this player
      footer = Buffer.concat([footer, Buffer.from('U'), Buffer.from([10]), Buffer.from('characters{')]);

      // Write character usage
      forEach(player.characterUsage, (usage, internalId) => {
        // Write this character
        footer = Buffer.concat([
          footer,
          Buffer.from('U'),
          Buffer.from([internalId.length]),
          Buffer.from(`${internalId}l`),
          createUInt32Buffer(usage),
        ]);
      });

      // Close characters and player
      footer = Buffer.concat([footer, Buffer.from('}}')]);
    });

    // Close players
    footer = Buffer.concat([footer, Buffer.from('}')]);

    // Write played on
    footer = Buffer.concat([
      footer,
      Buffer.from('U'),
      Buffer.from([8]),
      Buffer.from('playedOnSU'),
      Buffer.from([7]),
      Buffer.from('network'),
    ]);

    // Close metadata and file
    footer = Buffer.concat([footer, Buffer.from('}}')]);

    // End the stream
    this.fileStream.write(footer, callback);
  }
}

const createInt32Buffer = (number: number): Buffer => {
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(number, 0);
  return buf;
};

const createUInt32Buffer = (number: number): Buffer => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(number, 0);
  return buf;
};

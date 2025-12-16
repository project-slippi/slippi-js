import { format } from "date-fns";
import path from "path";
import type { WritableOptions } from "stream";
import { Writable } from "stream";

import { Command } from "../../common/types";
import type { SlpRawEventPayload, SlpStreamSettings } from "../../common/utils/slpStream";
import { SlpStream, SlpStreamEvent } from "../../common/utils/slpStream";
import { SlpFile } from "./slpFile";

/**
 * The default function to use for generating new SLP files.
 */
function getNewFilePath(folder: string, date: Date): string {
  return path.join(folder, `Game_${format(date, "yyyyMMdd")}T${format(date, "HHmmss")}.slp`);
}

export type SlpFileWriterOptions = Partial<SlpStreamSettings> & {
  outputFiles: boolean;
  folderPath: string;
  consoleNickname: string;
  newFilename: (folder: string, startTime: Date) => string;
};

const defaultSettings: SlpFileWriterOptions = {
  outputFiles: true,
  folderPath: ".",
  consoleNickname: "unknown",
  newFilename: getNewFilePath,
};

export enum SlpFileWriterEvent {
  NEW_FILE = "new-file",
  FILE_COMPLETE = "file-complete",
}

/**
 * SlpFileWriter lets us not only emit events as an SlpStream but also
 * writes the data that is being passed in to an SLP file. Use this if
 * you want to process Slippi data in real time but also want to be able
 * to write out the data to an SLP file.
 *
 * @export
 * @class SlpFileWriter
 * @extends {Writable}
 */
export class SlpFileWriter extends Writable {
  private currentFile?: SlpFile;
  private options: SlpFileWriterOptions;
  private processor: SlpStream;

  /**
   * Creates an instance of SlpFileWriter.
   */
  public constructor(options?: Partial<SlpFileWriterOptions>, opts?: WritableOptions) {
    super(opts);
    this.options = Object.assign({}, defaultSettings, options);
    this.processor = new SlpStream(options);
    this._setupListeners();
  }

  /**
   * Access the underlying SlpStream processor for event listening
   */
  public getProcessor(): SlpStream {
    return this.processor;
  }

  // Implement _write to handle incoming data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override _write(chunk: Buffer, _encoding: string, callback: (error?: Error | null) => void): void {
    try {
      this.processor.process(new Uint8Array(chunk));
      callback();
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private _writePayload(payload: Uint8Array): void {
    // Write data to the current file
    if (this.currentFile) {
      // Convert Uint8Array to Buffer for Node.js fs operations
      const buffer = Buffer.from(payload);
      this.currentFile.write(buffer);
    }
  }

  private _setupListeners(): void {
    this.processor.on(SlpStreamEvent.RAW, (data: SlpRawEventPayload) => {
      const { command, payload } = data;
      switch (command) {
        case Command.MESSAGE_SIZES:
          // Create the new game first before writing the payload
          this._handleNewGame();
          this._writePayload(payload);
          break;
        case Command.GAME_END:
          // Write payload first before ending the game
          this._writePayload(payload);
          this._handleEndGame();
          break;
        default:
          this._writePayload(payload);
          break;
      }
    });
  }

  /**
   * Return the name of the SLP file currently being written or undefined if
   * no file is being written to currently.
   *
   * @returns {(string | undefined)}
   * @memberof SlpFileWriter
   */
  public getCurrentFilename(): string | undefined {
    if (this.currentFile != null) {
      return path.resolve(this.currentFile.path());
    }
    return undefined;
  }

  /**
   * Ends the current file being written to.
   *
   * @returns {(string | undefined)}
   * @memberof SlpFileWriter
   */
  public endCurrentFile(): void {
    this._handleEndGame();
  }

  /**
   * Updates the settings to be the desired ones passed in.
   *
   * @param {Partial<SlpFileWriterOptions>} settings
   * @memberof SlpFileWriter
   */
  public updateSettings(settings: Partial<SlpFileWriterOptions>): void {
    this.options = Object.assign({}, this.options, settings);
  }

  private _handleNewGame(): void {
    // Only create a new file if we're outputting files
    if (this.options.outputFiles) {
      const filePath = this.options.newFilename(this.options.folderPath, new Date());
      // Pass the processor to SlpFile so it can listen to events
      this.currentFile = new SlpFile(filePath, this.processor);
      // console.log(`Creating new file at: ${filePath}`);
      this.emit(SlpFileWriterEvent.NEW_FILE, filePath);
    }
  }

  private _handleEndGame(): void {
    // End the stream
    if (this.currentFile) {
      const filePath = this.currentFile.path();

      // Set the console nickname
      this.currentFile.setMetadata({
        consoleNickname: this.options.consoleNickname,
      });

      // Wait for the file to actually finish writing before emitting FILE_COMPLETE
      this.currentFile.once("finish", () => {
        this.emit(SlpFileWriterEvent.FILE_COMPLETE, filePath);
      });

      this.currentFile.end();

      // Clear current file
      this.currentFile = undefined;
    }
  }
}

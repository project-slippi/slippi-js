import { format } from "date-fns";
import path from "path";
import type { WritableOptions } from "stream";

import { Command } from "../types";
import { SlpFile } from "./slpFile";
import type { SlpRawEventPayload, SlpStreamSettings } from "./slpStream";
import { SlpStream, SlpStreamEvent } from "./slpStream";

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
 * @extends {SlpStream}
 */
export class SlpFileWriter extends SlpStream {
  private currentFile: SlpFile | null = null;
  private options: SlpFileWriterOptions;

  /**
   * Creates an instance of SlpFileWriter.
   */
  public constructor(options?: Partial<SlpFileWriterOptions>, opts?: WritableOptions) {
    super(options, opts);
    this.options = Object.assign({}, defaultSettings, options);
    this._setupListeners();
  }

  private _writePayload(payload: Buffer): void {
    // Write data to the current file
    if (this.currentFile) {
      this.currentFile.write(payload);
    }
  }

  private _setupListeners(): void {
    this.on(SlpStreamEvent.RAW, (data: SlpRawEventPayload) => {
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
   * Return the name of the SLP file currently being written or null if
   * no file is being written to currently.
   *
   * @returns {(string | null)}
   * @memberof SlpFileWriter
   */
  public getCurrentFilename(): string | null {
    if (this.currentFile !== null) {
      return path.resolve(this.currentFile.path());
    }
    return null;
  }

  /**
   * Ends the current file being written to.
   *
   * @returns {(string | null)}
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
      this.currentFile = new SlpFile(filePath, this);
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
      this.currentFile = null;
    }
  }
}

import fs from "fs";

import type { SlpInputRef } from "../../common/utils/slpInputRef";

export class SlpFileInputRef implements SlpInputRef {
  private fileDescriptor?: number;

  public constructor(private readonly filePath: string) {}

  public open(): void {
    if (this.fileDescriptor) {
      // File is already open so do nothing
      return;
    }
    this.fileDescriptor = fs.openSync(this.filePath, "r");
  }

  public size(): number {
    if (!this.fileDescriptor) {
      throw new Error("Tried to get the size of a closed SLP file");
    }
    return fs.fstatSync(this.fileDescriptor).size;
  }

  public close(): void {
    if (this.fileDescriptor) {
      fs.closeSync(this.fileDescriptor);
      this.fileDescriptor = undefined;
    }
  }

  public read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number {
    if (!this.fileDescriptor) {
      throw new Error("Tried to read from a closed SLP file");
    }

    return fs.readSync(this.fileDescriptor, targetBuffer, offset, length, position);
  }
}

import fs from "fs";

import type { BinaryLike } from "./bufferHelpers";
import { bufferCopy, byteLength } from "./bufferHelpers";

export interface SlpInputRef {
  read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number;
  size: number;
  open(): void;
  close(): void;
}

export class SlpFileInputRef implements SlpInputRef {
  private fileDescriptor: number | null = null;

  public constructor(private readonly filePath: string) {}

  public open(): void {
    if (this.fileDescriptor) {
      // File is already open so do nothing
      return;
    }
    this.fileDescriptor = fs.openSync(this.filePath, "r");
  }

  public get size(): number {
    if (!this.fileDescriptor) {
      throw new Error("Tried to get the size of a closed SLP file");
    }
    return fs.fstatSync(this.fileDescriptor).size;
  }

  public close(): void {
    if (this.fileDescriptor) {
      fs.closeSync(this.fileDescriptor);
      this.fileDescriptor = null;
    }
  }

  public read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number {
    if (!this.fileDescriptor) {
      throw new Error("Tried to read from a closed SLP file");
    }

    return fs.readSync(this.fileDescriptor, targetBuffer, offset, length, position);
  }
}

export class SlpBufferInputRef implements SlpInputRef {
  public constructor(private readonly buffer: BinaryLike) {}

  public open(): void {
    // Do nothing
  }

  public get size(): number {
    return byteLength(this.buffer);
  }

  public close(): void {
    // Do nothing
  }

  public read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number {
    if (position >= this.size) {
      return 0;
    }
    return bufferCopy(this.buffer, targetBuffer, offset, position, position + length);
  }
}

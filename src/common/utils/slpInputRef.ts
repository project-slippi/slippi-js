import type { BinaryLike } from "./bufferHelpers.js";
import { bufferCopy, byteLength } from "./bufferHelpers.js";

export interface SlpInputRef {
  read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number;
  size(): number;
  open(): void;
  close(): void;
}

export class SlpBufferInputRef implements SlpInputRef {
  constructor(private readonly buffer: BinaryLike) {}

  open(): void {
    // Do nothing
  }

  size(): number {
    return byteLength(this.buffer);
  }

  close(): void {
    // Do nothing
  }

  read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number {
    if (position >= this.size()) {
      return 0;
    }
    return bufferCopy(this.buffer, targetBuffer, offset, position, position + length);
  }
}

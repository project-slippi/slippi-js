import type { BinaryLike } from "./bufferHelpers";
import { bufferCopy, byteLength } from "./bufferHelpers";

export interface SlpInputRef {
  read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number;
  size(): number;
  open(): void;
  close(): void;
}

export class SlpBufferInputRef implements SlpInputRef {
  public constructor(private readonly buffer: BinaryLike) {}

  public open(): void {
    // Do nothing
  }

  public size(): number {
    return byteLength(this.buffer);
  }

  public close(): void {
    // Do nothing
  }

  public read(targetBuffer: Uint8Array, offset: number, length: number, position: number): number {
    if (position >= this.size()) {
      return 0;
    }
    return bufferCopy(this.buffer, targetBuffer, offset, position, position + length);
  }
}

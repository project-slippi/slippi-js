import { InternalSlippiGame } from "./InternalSlippiGame";
import type { StatOptions } from "./stats";
import { type BinaryLike, asUint8Array, isBufferLike } from "./utils/bufferHelpers";
import { SlpFileInputRef } from "./utils/slpFileInputRef";
import { SlpBufferInputRef } from "./utils/slpInputRef";

export class SlippiGame extends InternalSlippiGame {
  protected readonly filePath: string | null;

  public constructor(input: string | BinaryLike, opts?: StatOptions) {
    if (typeof input === "string") {
      super(new SlpFileInputRef(input), opts);
      this.filePath = input;
    } else if (isBufferLike(input)) {
      super(new SlpBufferInputRef(asUint8Array(input)), opts);
      this.filePath = null;
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }

  public override getFilePath(): string | null {
    return this.filePath;
  }
}

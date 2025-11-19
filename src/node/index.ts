import { SlippiGame as InternalSlippiGame } from "../common/SlippiGame";
import type { StatOptions } from "../common/stats";
import { type BinaryLike, asUint8Array, isBufferLike } from "../common/utils/bufferHelpers";
import { SlpBufferInputRef } from "../common/utils/slpInputRef";
import { SlpFileInputRef } from "./utils/slpFileInputRef";

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

// Export everything that works in both the browser and node
export * from "../common/index";

// Export everything that is node-specific
export * from "./console";
export * from "./utils/slpFile";
export * from "./utils/slpFileWriter";
export * from "./utils/slpStream";

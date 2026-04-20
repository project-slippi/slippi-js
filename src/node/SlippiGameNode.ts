import { SlippiGameBase } from "../common/SlippiGameBase.js";
import type { StatOptions } from "../common/stats/index.js";
import { type BinaryLike, isBufferLike } from "../common/utils/bufferHelpers.js";
import { SlpBufferInputRef } from "../common/utils/slpInputRef.js";
import { SlpFileInputRef } from "./utils/slpFileInputRef.js";

export class SlippiGameNode extends SlippiGameBase {
  private readonly filePath?: string;

  public constructor(input: string | BinaryLike, opts?: StatOptions) {
    if (typeof input === "string") {
      super(new SlpFileInputRef(input), opts);
      this.filePath = input;
    } else if (isBufferLike(input)) {
      super(new SlpBufferInputRef(input), opts);
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }

  public override getFilePath(): string | undefined {
    return this.filePath;
  }
}

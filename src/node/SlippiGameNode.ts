import { SlippiGameBase } from "../common/SlippiGameBase";
import type { StatOptions } from "../common/stats";
import { type BinaryLike, isBufferLike } from "../common/utils/bufferHelpers";
import { SlpBufferInputRef } from "../common/utils/slpInputRef";
import { SlpFileInputRef } from "./utils/slpFileInputRef";

export class SlippiGameNode extends SlippiGameBase {
  private readonly filePath: string | null;

  public constructor(input: string | BinaryLike, opts?: StatOptions) {
    if (typeof input === "string") {
      super(new SlpFileInputRef(input), opts);
      this.filePath = input;
    } else if (isBufferLike(input)) {
      super(new SlpBufferInputRef(input), opts);
      this.filePath = null;
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }

  public override getFilePath(): string | null {
    return this.filePath;
  }
}

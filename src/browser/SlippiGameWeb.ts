import { SlippiGameBase } from "../common/SlippiGameBase.js";
import type { StatOptions } from "../common/stats/index.js";
import type { BinaryLike } from "../common/utils/bufferHelpers.js";
import { isBufferLike } from "../common/utils/bufferHelpers.js";
import { SlpBufferInputRef } from "../common/utils/slpInputRef.js";

export class SlippiGameWeb extends SlippiGameBase {
  public constructor(input: BinaryLike, opts?: StatOptions) {
    if (isBufferLike(input)) {
      super(new SlpBufferInputRef(input), opts);
    } else if (typeof input === "string") {
      throw new Error(
        "Cannot create SlippiGame with a file path in the browser. If you're running node, import from '@slippi/slippi-js/node' instead.",
      );
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }

  public override getFilePath(): string | undefined {
    return undefined;
  }
}

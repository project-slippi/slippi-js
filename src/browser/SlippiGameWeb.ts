import { SlippiGameBase } from "../common/SlippiGameBase";
import type { StatOptions } from "../common/stats";
import type { BinaryLike } from "../common/utils/bufferHelpers";
import { isBufferLike } from "../common/utils/bufferHelpers";
import { SlpBufferInputRef } from "../common/utils/slpInputRef";

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

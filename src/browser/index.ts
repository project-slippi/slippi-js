import { SlippiGame as InternalSlippiGame } from "../common/SlippiGame";
import type { StatOptions } from "../common/stats";
import type { BinaryLike } from "../common/utils/bufferHelpers";
import { asUint8Array, isBufferLike } from "../common/utils/bufferHelpers";
import { SlpBufferInputRef } from "../common/utils/slpInputRef";

/**
 * Slippi Game class that wraps a file
 */
export class SlippiGame extends InternalSlippiGame {
  public constructor(input: BinaryLike, opts?: StatOptions) {
    if (isBufferLike(input)) {
      super(new SlpBufferInputRef(asUint8Array(input)), opts);
    } else if (typeof input === "string") {
      throw new Error(
        "Cannot create SlippiGame with a file path in the browser. Import from the node version instead.",
      );
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }
}

export * from "../common/index";

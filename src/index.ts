import { SlippiGame as InternalSlippiGame } from "./SlippiGame";
import type { StatOptions } from "./stats";
import type { BinaryLike } from "./utils/bufferHelpers";
import { asUint8Array, isBufferLike } from "./utils/bufferHelpers";
import { SlpBufferInputRef } from "./utils/slpInputRef";

/**
 * Slippi Game class that wraps a file
 */
export class SlippiGame extends InternalSlippiGame {
  public constructor(input: string | BinaryLike, opts?: StatOptions) {
    if (typeof input === "string") {
      throw new Error(
        "Cannot create SlippiGame with a file path in the browser. Import from the node version instead.",
      );
    } else if (isBufferLike(input)) {
      super(new SlpBufferInputRef(asUint8Array(input)), opts);
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }
}

export * from "./index.common";

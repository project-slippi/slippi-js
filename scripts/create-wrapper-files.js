#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "../dist");

// ============================================
// Browser Wrapper Files
// ============================================

const browserESM = `import { SlippiGame as InternalSlippiGame } from "../common/SlippiGame.esm.js";
import { asUint8Array, isBufferLike } from "../common/utils/bufferHelpers.esm.js";
import { SlpBufferInputRef } from "../common/utils/slpInputRef.esm.js";

/**
 * Slippi Game class that wraps a file
 */
export class SlippiGame extends InternalSlippiGame {
  constructor(input, opts) {
    if (isBufferLike(input)) {
      super(new SlpBufferInputRef(asUint8Array(input)), opts);
    } else if (typeof input === "string") {
      throw new Error(
        "Cannot create SlippiGame with a file path in the browser. Import from the node version instead."
      );
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }
}

// Re-export everything from common
export * from "../common/index.common.esm.js";
`;

const browserCJS = `'use strict';

const { SlippiGame: InternalSlippiGame } = require("../common/SlippiGame.cjs");
const { asUint8Array, isBufferLike } = require("../common/utils/bufferHelpers.cjs");
const { SlpBufferInputRef } = require("../common/utils/slpInputRef.cjs");

/**
 * Slippi Game class that wraps a file
 */
class SlippiGame extends InternalSlippiGame {
  constructor(input, opts) {
    if (isBufferLike(input)) {
      super(new SlpBufferInputRef(asUint8Array(input)), opts);
    } else if (typeof input === "string") {
      throw new Error(
        "Cannot create SlippiGame with a file path in the browser. Import from the node version instead."
      );
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }
  }
}

// Re-export everything from common
const common = require("../common/index.common.cjs");

module.exports = {
  SlippiGame,
  ...common,
};
`;

// ============================================
// Node Wrapper Files
// ============================================

const nodeESM = `import { SlippiGame as InternalSlippiGame } from "../common/SlippiGame.esm.js";
import { asUint8Array, isBufferLike } from "../common/utils/bufferHelpers.esm.js";
import { SlpBufferInputRef } from "../common/utils/slpInputRef.esm.js";
import { SlpFileInputRef } from "./nodeUtils/slpFileInputRef.esm.js";

/**
 * Slippi Game class for Node.js
 */
export class SlippiGame extends InternalSlippiGame {
  constructor(input, opts) {
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

  getFilePath() {
    return this.filePath;
  }
}

// Re-export everything from common
export * from "../common/index.common.esm.js";

// Re-export node-specific modules
export * from "./console/communication.esm.js";
export * from "./console/consoleConnection.esm.js";
export * from "./console/dolphinConnection.esm.js";
export * from "./console/types.esm.js";
export * from "./nodeUtils/slpFile.esm.js";
export * from "./nodeUtils/slpFileWriter.esm.js";
export * from "./nodeUtils/slpStream.esm.js";
`;

const nodeCJS = `'use strict';

const { SlippiGame: InternalSlippiGame } = require("../common/SlippiGame.cjs");
const { asUint8Array, isBufferLike } = require("../common/utils/bufferHelpers.cjs");
const { SlpBufferInputRef } = require("../common/utils/slpInputRef.cjs");
const { SlpFileInputRef } = require("./nodeUtils/slpFileInputRef.cjs");

/**
 * Slippi Game class for Node.js
 */
class SlippiGame extends InternalSlippiGame {
  constructor(input, opts) {
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

  getFilePath() {
    return this.filePath;
  }
}

// Re-export everything from common
const common = require("../common/index.common.cjs");

// Re-export node-specific modules
const consoleCommunication = require("./console/communication.cjs");
const consoleConnection = require("./console/consoleConnection.cjs");
const dolphinConnection = require("./console/dolphinConnection.cjs");
const consoleTypes = require("./console/types.cjs");
const slpFile = require("./nodeUtils/slpFile.cjs");
const slpFileWriter = require("./nodeUtils/slpFileWriter.cjs");
const slpStream = require("./nodeUtils/slpStream.cjs");

module.exports = {
  SlippiGame,
  ...common,
  ...consoleCommunication,
  ...consoleConnection,
  ...dolphinConnection,
  ...consoleTypes,
  ...slpFile,
  ...slpFileWriter,
  ...slpStream,
};
`;

// ============================================
// Write Files
// ============================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Write browser wrappers
ensureDir(path.join(DIST_DIR, "browser"));
fs.writeFileSync(path.join(DIST_DIR, "browser/index.esm.js"), browserESM);
fs.writeFileSync(path.join(DIST_DIR, "browser/index.cjs"), browserCJS);
console.log("✓ Generated browser wrappers: index.esm.js, index.cjs");

// Write node wrappers
ensureDir(path.join(DIST_DIR, "node"));
fs.writeFileSync(path.join(DIST_DIR, "node/index.esm.js"), nodeESM);
fs.writeFileSync(path.join(DIST_DIR, "node/index.cjs"), nodeCJS);
console.log("✓ Generated node wrappers: index.esm.js, index.cjs");

console.log("\n✓ All wrapper files generated successfully!");

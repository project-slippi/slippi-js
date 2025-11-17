#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

// Import the output configuration from rollup.config.mjs
const configPath = path.join(__dirname, "../rollup.config.mjs");
const configURL = pathToFileURL(configPath).href;

// Dynamic import for ESM module
(async () => {
  const { OUTPUT_CONFIG } = await import(configURL);
  const DIST_DIR = path.join(__dirname, "../dist");

  /**
   * Generate an entry file that switches between development and production builds
   */
  function generateEntryFile(config, label) {
    // Extract the subdirectory (e.g., "node" or "browser") from "dist/node" or "dist/browser"
    const subdir = config.dir.replace(/^dist[/\\]?/, "");
    const entry = `'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${subdir}/${config.production}')
} else {
  module.exports = require('./${subdir}/${config.development}')
}
`;

    const entryPath = path.join(DIST_DIR, config.entry);
    fs.writeFileSync(entryPath, entry, "utf8");
    console.log(`✓ Generated ${label} entry: ${config.entry}`);
  }

  // Generate entry files
  generateEntryFile(OUTPUT_CONFIG.node, "Node.js");
  generateEntryFile(OUTPUT_CONFIG.browser, "Browser");
})();

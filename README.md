# `slippi-js`

[![npm version](http://img.shields.io/npm/v/@slippi/slippi-js.svg?style=flat)](https://npmjs.org/package/@slippi/slippi-js "View this project on npm")
[![Build Status](https://github.com/project-slippi/slippi-js/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/project-slippi/slippi-js/actions/workflows/build.yml?query=branch%3Amaster)
[![Coverage Status](https://coveralls.io/repos/github/project-slippi/slippi-js/badge.svg)](https://coveralls.io/github/project-slippi/slippi-js)
[![License](https://img.shields.io/npm/l/@slippi/slippi-js)](https://github.com/project-slippi/slippi-js/blob/master/LICENSE)

This is the official Project Slippi Javascript SDK. It provides tools for parsing `.slp` files into structured data and can be used to compute stats. There are already many built-in stats that are computed by the library but the data provided can also be used to compute your own stats.

## Installation

**With NPM**

```bash
npm install @slippi/slippi-js
```

**With Yarn**

```bash
yarn add @slippi/slippi-js
```

## Browser vs Node.js

This library provides two separate entry points depending on your environment:

### Default Export: `@slippi/slippi-js` (Browser/Web)

The default export is optimized for browser and web environments. It only accepts binary data as input (buffers, ArrayBuffers, Uint8Arrays, etc.) and **cannot read files from disk**.

```js
import { SlippiGame } from "@slippi/slippi-js";

// Works with binary data
const arrayBuffer = await fetch("game.slp").then((r) => r.arrayBuffer());
const game = new SlippiGame(arrayBuffer);

// Will throw an error in the browser
const game = new SlippiGame("path/to/file.slp"); // ❌ Error!
```

> **💡 See the [browser-stream example](./examples/browser-stream/)** for a complete web application demonstrating real-time replay file processing in the browser.

### Node.js Export: `@slippi/slippi-js/node`

The Node.js export is designed for server-side and Node.js environments. It can read files directly from disk using file paths **and** also accepts binary data. Additionally, it includes Node.js-specific features like console connections, file writing, and streaming utilities.

```js
const { SlippiGame } = require("@slippi/slippi-js/node");
// or with ES modules:
// import { SlippiGame } from "@slippi/slippi-js/node";

// Works with file paths
const game = new SlippiGame("path/to/file.slp"); // ✅

// Also works with binary data
const buffer = fs.readFileSync("path/to/file.slp");
const game = new SlippiGame(buffer); // ✅
```

**Additional Node.js-only exports:**

- Console and Dolphin connection utilities for real-time game capture
- `SlpFileWriter` for creating `.slp` files

**Rule of thumb:** Use `@slippi/slippi-js/node` for Node.js applications and scripts. Use the default `@slippi/slippi-js` for browser/web applications.

> **💡 See the [realtime-file-reads example](./examples/realtime-file-reads/)** for a Node.js script that monitors live games using file system watching.

## Quick Start

### Writing a Simple Script

1. Create a fresh directory on your disk
2. Inside this new directory, create a file called `script.js`
3. Fill the `script.js` file with the following contents:

```js
const { SlippiGame } = require("@slippi/slippi-js/node");

const game = new SlippiGame("test.slp");

// Get game settings – stage, characters, etc
const settings = game.getSettings();
console.log(settings);

// Get metadata - start time, platform played on, etc
const metadata = game.getMetadata();
console.log(metadata);

// Get computed stats - openings / kill, conversions, etc
const stats = game.getStats();
console.log(stats);

// Get frames – animation state, inputs, etc
// This is used to compute your own stats or get more frame-specific info (advanced)
const frames = game.getFrames();
console.log(frames[0].players); // Print frame when timer starts counting down
```

4. Copy a .slp file into the directory and call it `test.slp`
5. Browse to the directory from the command line and run the command: `npm install @slippi/slippi-js`. This should create a `node_modules` directory in the folder.
6. Run the command: `node script.js`. This will run the script above and will print data about the `test.slp` file

> **💡 Tip:** See the [examples](./examples/) directory for more advanced usage including live file monitoring and browser-based replay processing.

## Examples

The library supports processing replay files in real-time as they're being written. This is useful for live overlays, game monitoring, and analysis tools.

### 🌐 [Browser Stream Example](./examples/browser-stream/)

Demonstrates processing replay files in a web browser with simulated streaming using the low-level `SlpStream` and `SlpParser` APIs. Perfect for understanding how to handle chunked data in browser environments.

**Features:** Interactive web UI, configurable chunk sizes, real-time event log, progress tracking

### 📂 [Realtime File Reads Example](./examples/realtime-file-reads/)

Demonstrates monitoring a directory for live `.slp` file changes and processing them as they're written using the high-level `SlippiGame` API in Node.js.

**Features:** File system watching, live game state (stocks/damage), incremental updates, game end detection

### Reading Live Files

When reading files that are actively being written (e.g., during a live game), use the `processOnTheFly` option:

```javascript
const { SlippiGame } = require("@slippi/slippi-js/node");

const game = new SlippiGame("path/to/live/file.slp", { processOnTheFly: true });
```

This allows the `SlippiGame` instance to read partial files and be re-read as new data becomes available. See the [realtime-file-reads example](./examples/realtime-file-reads/) for a complete implementation with file watching.

## Development

### Setup

```bash
git clone https://github.com/project-slippi/slippi-js
cd slippi-js
npm install
```

### Build

```bash
npm run build
```

You can also run `npm run watch` to continuously build whenever changes are detected.

### Test

```bash
npm run test
```

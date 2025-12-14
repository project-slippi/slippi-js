# Slippi-JS Examples

This directory contains examples demonstrating how to use slippi-js in different environments.

## Browser Stream Test

The `browser-test/` directory contains a web application that demonstrates using `SlpStream` and `SlpParser` in a web browser to process `.slp` files with simulated streaming.

### Features

- **File Upload**: Select any `.slp` file from your computer
- **Configurable Streaming**: Adjust chunk size and delay to simulate different streaming conditions
- **Real-time Event Log**: See events as they're processed with timestamps
- **Statistics Dashboard**: Monitor frames processed, finalized frames, and total events
- **Progress Tracking**: Visual progress bar showing file processing status

### Running the Example

1. **Build the main library** (from the root directory):

   ```bash
   npm run build
   ```

2. **Install example dependencies** (from the examples directory):

   ```bash
   cd examples
   npm install
   ```

3. **Build the browser example**:

   ```bash
   npm run build:browser
   ```

   This bundles the TypeScript source with all dependencies (including lodash, semver, etc.) into a single `bundle.js` file that works in the browser.

4. **Serve the example**:

   ```bash
   npm run serve
   ```

5. **Open in browser**:
   Navigate to `http://localhost:8080`

6. **Test it**:
   - Click "Select .slp file" and choose a replay file
   - Adjust chunk size and delay if desired
   - Click "Start Processing" to begin
   - Watch the event log and statistics update in real-time

### How It Works

The example demonstrates the web-compatible architecture of slippi-js:

1. **SlpStream** - Processes raw binary data in chunks, emitting events for each SLP command
2. **SlpParser** - Consumes SlpStream events and builds up the game state, emitting higher-level events for:
   - Game settings
   - Frame updates
   - Finalized frames (frames that won't be rolled back)
   - Game end

The file is read as a `Uint8Array` and fed to `SlpStream.process()` in configurable chunks with artificial delays to simulate real-time streaming conditions similar to receiving data from a console.

### Build Process

The example uses **esbuild** to bundle the TypeScript source (`src/browser-stream-test.ts`) along with all npm dependencies (lodash, semver, etc.) into a single `bundle.js` file that works in the browser. This ensures:

- All dependencies are bundled (no external module resolution needed)
- TypeScript is transpiled to JavaScript
- Source maps are generated for debugging
- The bundle is optimized for browser execution

### Architecture

```
Source: src/browser-stream-test.ts
    ↓ (esbuild bundles with dependencies)
Output: browser-test/bundle.js
    ↓ (loaded by index.html)
File Input (Uint8Array)
    ↓ (chunked with delay)
SlpStream.process()
    ↓ (emits SlpStreamEvent.COMMAND)
SlpParser.handleCommand()
    ↓ (emits SlpParserEvent.*)
UI Updates (logs, stats, progress)
```

This example works entirely in the browser with no Node.js-specific APIs, demonstrating the cross-platform nature of the refactored slippi-js library.

## Node.js Example

See `realtimeFileReads.js` for an example of processing files in Node.js with real-time monitoring.

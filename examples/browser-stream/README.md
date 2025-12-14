# Browser Stream Example

This example demonstrates processing Slippi replay files in a web browser with simulated streaming conditions using the low-level `SlpStream` and `SlpParser` APIs.

## What It Demonstrates

- **Chunked data processing**: Reads a `.slp` file and feeds it in small chunks to simulate streaming
- **Event-driven architecture**: Shows how `SlpStream` emits raw commands and `SlpParser` emits game events
- **Browser compatibility**: Works entirely in the browser using only web APIs (no Node.js dependencies)
- **Configurable streaming**: Adjust chunk sizes and delays to simulate different network conditions

This mimics receiving data from a console during a live game, where data arrives in small chunks over the network.

## Features

- 📁 File upload interface
- ⚙️ Configurable chunk size (256B - 8KB) and delay (1-100ms)
- 📊 Real-time event log with timestamps
- 📈 Statistics dashboard (events, frames, finalized frames, elapsed time)
- 📉 Visual progress bar
- 🎨 Modern UI with syntax-highlighted logs

## Running the Example

1. **Build the main library** (from the root directory):

   ```bash
   npm run build
   ```

2. **Navigate here and install dependencies**:

   ```bash
   cd examples/browser-stream
   npm install
   ```

3. **Build the example**:

   ```bash
   npm run build
   ```

4. **Serve and open**:

   ```bash
   npm run serve
   ```

   Then navigate to `http://localhost:8080`

5. **Test it**:
   - Select a `.slp` file
   - Adjust chunk size and delay
   - Click "Start Processing"
   - Watch the real-time event log and statistics

## How It Works

```
User uploads .slp file
    ↓
File read as Uint8Array
    ↓
Split into chunks (e.g., 1024 bytes)
    ↓
SlpStream.process(chunk) → emits COMMAND events
    ↓
SlpParser.handleCommand() → emits SETTINGS, FRAME, FINALIZED_FRAME, END
    ↓
UI updates in real-time
```

## Code Structure

- `src/browser-stream-test.ts` - Main application code (read this!)
- `index.html` - UI and styling
- `esbuild.config.mjs` - Bundler configuration
- `dist/bundle.js` - Built output (generated)

**💡 Tip**: Read the TypeScript source in `src/browser-stream-test.ts` to see exactly how `SlpStream` and `SlpParser` work together. The code is well-commented and shows the complete pattern.

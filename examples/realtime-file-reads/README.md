# Realtime File Reads Example

This example demonstrates monitoring a directory for `.slp` file changes and processing them in real-time using the high-level `SlippiGame` API in Node.js.

## What It Demonstrates

- **File system watching**: Uses `chokidar` to detect when `.slp` files are modified
- **Partial file reading**: Reads incomplete replay files with `processOnTheFly: true`
- **Incremental updates**: Tracks game state as new data becomes available
- **Live game monitoring**: Displays current stocks, percentages, and frame counts

This is useful for building overlays, real-time analysis tools, or any application that needs to track live games.

## Features

- 👀 Directory watching for `.slp` file changes
- 🎮 Live game state (stocks, damage, character names)
- 📊 Frame counting
- ⚡ Performance tracking (read/parse time)
- 🏁 Game end detection (TIME!, GAME!, No Contest)

## Running the Example

1. **Build the main library** (from the root directory):

   ```bash
   npm run build
   ```

2. **Navigate here and install dependencies**:

   ```bash
   cd examples/realtime-file-reads
   npm install
   ```

3. **Run the script with a path to watch**:

   ```bash
   node realtimeFileReads.js /path/to/slippi/replays
   ```

   Common paths:

   - **Slippi Desktop (Mac)**: `~/Documents/Slippi/`
   - **Slippi Desktop (Windows)**: `Documents\Slippi\`
   - **Custom**: Check your Slippi settings for the replay directory

4. **Start a game** and watch the console output update in real-time!

## Example Output

```
Listening at: /Users/player/Documents/Slippi/
New file at: /Users/player/Documents/Slippi/Game_20231215T120000.slp
[Game Start] New game has started
{ stageId: 31, players: [...], ... }
We have 123 frames.
Fox [Port 1] 15.3% | 4 stocks
Falco [Port 2] 42.8% | 3 stocks
Read took: 12 ms
We have 456 frames.
Fox [Port 1] 67.2% | 3 stocks
Falco [Port 2] 89.5% | 2 stocks
Read took: 15 ms
...
[Game Complete] Type: GAME!
```

## Key Concept

The critical option is `processOnTheFly: true` when creating the `SlippiGame` instance:

```javascript
const game = new SlippiGame(path, { processOnTheFly: true });
```

This allows reading incomplete files and calling methods like `getSettings()`, `getFrames()`, `getLatestFrame()`, etc. on files that are still being written.

## Code Structure

- `realtimeFileReads.js` - Complete example (read this!)
- `package.json` - Dependencies

**💡 Tip**: Read `realtimeFileReads.js` to see the complete pattern. It's a standalone script showing file watching, game state tracking, and console output. The code is heavily commented with additional examples for stats tracking.

# Slippi-JS Examples

This directory contains examples demonstrating how to use slippi-js to process Slippi replay files in real-time or as they're being written. Both examples showcase **partial/live replay processing** - reading `.slp` files before they're complete.

## Examples

### 🌐 [Browser Stream](./browser-stream/)

Demonstrates processing replay files with simulated streaming in a web browser using the low-level `SlpStream` and `SlpParser` APIs.

**Shows:**

- Chunked data processing (simulating network streaming)
- Event-driven architecture
- Browser compatibility (no Node.js APIs)
- Real-time UI updates with progress tracking

**Use this approach when:** Building web applications, receiving data over network, or need fine-grained control over processing.

---

### 📂 [Realtime File Reads](./realtime-file-reads/)

Demonstrates monitoring a directory for live `.slp` file changes and processing them as they're written using the high-level `SlippiGame` API in Node.js.

**Shows:**

- File system watching with `chokidar`
- Processing incomplete replay files (`processOnTheFly: true`)
- Live game state monitoring (stocks, damage, frames)
- Detecting game completion

**Use this approach when:** Monitoring live games, building overlays, or creating real-time analysis tools in Node.js.

---

## When to Use Each Approach

| Approach                | Environment | API Level                            | Best For                                       |
| ----------------------- | ----------- | ------------------------------------ | ---------------------------------------------- |
| **Browser Stream**      | Browser     | Low-level (`SlpStream`, `SlpParser`) | Web apps, network streaming, custom processing |
| **Realtime File Reads** | Node.js     | High-level (`SlippiGame`)            | File monitoring, overlays, statistics          |

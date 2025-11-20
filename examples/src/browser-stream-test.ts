import { SlpStream, SlpStreamEvent, SlpParser, SlpParserEvent } from "@slippi/slippi-js";

// UI Elements
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const chunkSizeInput = document.getElementById("chunkSize") as HTMLInputElement;
const chunkSizeValue = document.getElementById("chunkSizeValue") as HTMLSpanElement;
const delayMsInput = document.getElementById("delayMs") as HTMLInputElement;
const delayMsValue = document.getElementById("delayMsValue") as HTMLSpanElement;
const eventLog = document.getElementById("eventLog") as HTMLDivElement;
const totalEventsEl = document.getElementById("totalEvents") as HTMLDivElement;
const framesProcessedEl = document.getElementById("framesProcessed") as HTMLDivElement;
const finalizedFramesEl = document.getElementById("finalizedFrames") as HTMLDivElement;
const elapsedTimeEl = document.getElementById("elapsedTime") as HTMLDivElement;
const progressBar = document.getElementById("progressBar") as HTMLDivElement;

// State
let selectedFile: File | null = null;
let isProcessing = false;
let startTime = 0;
let stats = {
  totalEvents: 0,
  framesProcessed: 0,
  finalizedFrames: 0,
};

// Update chunk size display
chunkSizeInput.addEventListener("input", () => {
  chunkSizeValue.textContent = chunkSizeInput.value;
});

// Update delay display
delayMsInput.addEventListener("input", () => {
  delayMsValue.textContent = delayMsInput.value;
});

// File selection
fileInput.addEventListener("change", (e) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile = target.files[0];
    startBtn.disabled = false;
    addLog("FILE", `Selected: ${selectedFile.name} (${formatBytes(selectedFile.size)})`);
  }
});

// Clear log
clearBtn.addEventListener("click", () => {
  eventLog.innerHTML = "";
  stats = { totalEvents: 0, framesProcessed: 0, finalizedFrames: 0 };
  updateStats();
});

// Start processing
startBtn.addEventListener("click", async () => {
  if (!selectedFile || isProcessing) return;

  isProcessing = true;
  startBtn.disabled = true;
  fileInput.disabled = true;
  chunkSizeInput.disabled = true;
  delayMsInput.disabled = true;

  stats = { totalEvents: 0, framesProcessed: 0, finalizedFrames: 0 };
  updateStats();

  try {
    await processFile();
  } catch (error) {
    addLog("ERROR", error instanceof Error ? error.message : String(error));
    console.error("Processing error:", error);
  } finally {
    isProcessing = false;
    startBtn.disabled = false;
    fileInput.disabled = false;
    chunkSizeInput.disabled = false;
    delayMsInput.disabled = false;
  }
});

async function processFile() {
  if (!selectedFile) return;

  const chunkSize = parseInt(chunkSizeInput.value);
  const delayMs = parseInt(delayMsInput.value);

  addLog("START", `Processing ${selectedFile.name} with ${chunkSize}B chunks, ${delayMs}ms delay`);
  startTime = Date.now();

  // Create SlpStream and SlpParser
  const slpStream = new SlpStream();
  const slpParser = new SlpParser();

  // Throttle stats updates to avoid blocking UI
  let pendingStatsUpdate = false;
  const scheduleStatsUpdate = () => {
    if (!pendingStatsUpdate) {
      pendingStatsUpdate = true;
      requestAnimationFrame(() => {
        updateStats();
        pendingStatsUpdate = false;
      });
    }
  };

  // Connect SlpStream to SlpParser
  slpStream.on(SlpStreamEvent.COMMAND, (data) => {
    stats.totalEvents++;
    slpParser.handleCommand(data.command, data.payload);
  });

  // Listen to SlpParser events
  slpParser.on(SlpParserEvent.SETTINGS, (settings) => {
    const playerCount = settings.players ? settings.players.length : 0;
    addLog("SETTINGS", `Game started - Stage: ${settings.stageId}, Players: ${playerCount}`, "log-settings");
  });

  slpParser.on(SlpParserEvent.FRAME, (frame) => {
    stats.framesProcessed++;
  });

  slpParser.on(SlpParserEvent.FINALIZED_FRAME, (frame) => {
    try {
      stats.finalizedFrames++;
      const frameNum = frame?.frame ?? "unknown";
      addLog("FINALIZED", `Frame ${frameNum} finalized (${stats.finalizedFrames} total)`, "log-finalized");
      scheduleStatsUpdate();
    } catch (error) {
      console.error("Error in FINALIZED_FRAME handler:", error);
      addLog("ERROR", `Frame handler error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  slpParser.on(SlpParserEvent.END, (gameEnd) => {
    const lras =
      gameEnd.lrasInitiatorIndex !== undefined && gameEnd.lrasInitiatorIndex !== null
        ? gameEnd.lrasInitiatorIndex
        : "N/A";
    addLog("END", `Game ended - Method: ${gameEnd.gameEndMethod}, LRas: ${lras}`, "log-end");
    scheduleStatsUpdate();
  });

  // Read file and feed it in chunks
  const arrayBuffer = await selectedFile.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const totalSize = uint8Array.length;
  let offset = 0;

  addLog("INFO", `File loaded: ${formatBytes(totalSize)} total`);

  while (offset < totalSize) {
    const chunk = uint8Array.slice(offset, offset + chunkSize);

    // Process the chunk
    slpStream.process(chunk);

    offset += chunk.length;
    const progress = (offset / totalSize) * 100;
    updateProgress(progress);

    // Artificial delay to simulate streaming
    // Also yields to the browser to prevent blocking
    await sleep(delayMs);
  }

  // Give the browser time to finish any pending event processing
  await sleep(50);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  addLog(
    "COMPLETE",
    `Finished processing in ${elapsed}s - ${stats.totalEvents} events, ${stats.framesProcessed} frames, ${stats.finalizedFrames} finalized`,
  );
  updateStats();
  updateProgress(100);
}

function addLog(event: string, message: string, extraClass: string = "") {
  const timestamp = formatTimestamp();
  const entry = document.createElement("div");
  entry.className = `log-entry ${extraClass}`;
  entry.innerHTML = `
    <span class="log-timestamp">[${timestamp}]</span>
    <span class="log-event">${event}</span>
    <span class="log-data">${escapeHtml(message)}</span>
  `;
  eventLog.appendChild(entry);
  eventLog.scrollTop = eventLog.scrollHeight;
}

function updateStats() {
  totalEventsEl.textContent = stats.totalEvents.toLocaleString();
  framesProcessedEl.textContent = stats.framesProcessed.toLocaleString();
  finalizedFramesEl.textContent = stats.finalizedFrames.toLocaleString();

  if (startTime > 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    elapsedTimeEl.textContent = `${elapsed}s`;
  }
}

function updateProgress(percent: number) {
  const rounded = Math.round(percent);
  progressBar.style.width = `${rounded}%`;
  progressBar.textContent = `${rounded}%`;
}

function formatTimestamp(): string {
  if (startTime === 0) return "--:--:--.---";
  const elapsed = Date.now() - startTime;
  const ms = elapsed % 1000;
  const s = Math.floor(elapsed / 1000) % 60;
  const m = Math.floor(elapsed / 60000) % 60;
  const h = Math.floor(elapsed / 3600000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, "0");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

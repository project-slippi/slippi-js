// Support CJS (v7-) and ESM default export (v8+)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type ReconnectCoreModule = typeof import("reconnect-core");

let reconnectCoreModule: ReconnectCoreModule | undefined;
let loadPromise: Promise<ReconnectCoreModule | undefined> | undefined;

// Keep a single dynamic import function that TS won’t downlevel.
const dynamicImport: (s: string) => Promise<any> =
  // eslint-disable-next-line no-new-func
  new Function("s", "return import(s)") as any;

async function maybeLoadReconnectCoreModule(): Promise<ReconnectCoreModule | undefined> {
  if (reconnectCoreModule) {
    return reconnectCoreModule;
  }
  if (loadPromise) {
    return loadPromise;
  }

  // Try CJS first (works in both Node & webpack)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("reconnect-core") as any;
    reconnectCoreModule = (mod?.default ? mod?.default : mod) as ReconnectCoreModule | undefined;
    return reconnectCoreModule;
  } catch (error: any) {
    // Ignore and try ESM
  }

  // Fallback: ESM dynamic import (v8+)
  loadPromise = dynamicImport("reconnect-core")
    .then((m: any) => (m?.default ? m?.default : m) as ReconnectCoreModule | undefined)
    .catch(() => undefined);

  reconnectCoreModule = await loadPromise;
  return reconnectCoreModule;
}

export async function loadReconnectCoreModule(): Promise<ReconnectCoreModule> {
  const reconnectCoreModule = await maybeLoadReconnectCoreModule();
  if (!reconnectCoreModule) {
    throw new Error("reconnect-core is required to connect to a console. Install it with: npm install reconnect-core");
  }
  return reconnectCoreModule;
}

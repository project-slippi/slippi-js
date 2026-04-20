// Support CJS (v7-) and ESM default export (v8+)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type ReconnectCoreModule = typeof import("reconnect-core");

let reconnectCoreModule: ReconnectCoreModule | undefined;
let loadPromise: Promise<ReconnectCoreModule | undefined> | undefined;

async function maybeLoadReconnectCoreModule(): Promise<ReconnectCoreModule | undefined> {
  if (reconnectCoreModule) {
    return reconnectCoreModule;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    // Try require first (CJS or bundler environments)
    try {
      if (typeof require !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const mod = require("reconnect-core") as any;
        return (mod?.default ?? mod) as ReconnectCoreModule;
      }
    } catch {
      // ignore
    }

    // Fallback: ESM dynamic import
    try {
      const mod = await import("reconnect-core");
      return (mod?.default ?? mod) as ReconnectCoreModule;
    } catch {
      return undefined;
    }
  })();

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

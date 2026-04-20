// Support CJS (v7-) and ESM default export (v8+)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type EnetModule = typeof import("enet");

let enetModule: EnetModule | undefined;
let loadPromise: Promise<EnetModule | undefined> | undefined;

async function maybeLoadEnetModule(): Promise<EnetModule | undefined> {
  if (enetModule) {
    return enetModule;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    // Try require first (CJS or bundler environments)
    try {
      if (typeof require !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const mod = require("enet") as any;
        return (mod?.default ?? mod) as EnetModule;
      }
    } catch {
      // ignore
    }

    // Fallback: ESM dynamic import
    try {
      const mod = await import("enet");
      return (mod?.default ?? mod) as EnetModule;
    } catch {
      return undefined;
    }
  })();

  enetModule = await loadPromise;
  return enetModule;
}

export async function loadEnetModule(): Promise<EnetModule> {
  const enetModule = await maybeLoadEnetModule();
  if (!enetModule) {
    throw new Error("enet is required to connect to Dolphin. Install it with: npm install enet");
  }
  return enetModule;
}

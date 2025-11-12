// Support CJS (v7-) and ESM default export (v8+)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type EnetModule = typeof import("enet");

let enetModule: EnetModule | undefined;
let loadPromise: Promise<EnetModule | undefined> | undefined;

// Keep a single dynamic import function that TS won’t downlevel.
const dynamicImport: (s: string) => Promise<any> =
  // eslint-disable-next-line no-new-func
  new Function("s", "return import(s)") as any;

async function maybeLoadEnetModule(): Promise<EnetModule | undefined> {
  if (enetModule) {
    return enetModule;
  }
  if (loadPromise) {
    return loadPromise;
  }

  // Try CJS first (works in both Node & webpack)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("enet") as any;
    enetModule = (mod?.default ? mod?.default : mod) as EnetModule | undefined;
    return enetModule;
  } catch (error: any) {
    // Ignore and try ESM
  }

  // Fallback: ESM dynamic import (v8+)
  loadPromise = dynamicImport("enet")
    .then((m: any) => (m?.default ? m?.default : m) as EnetModule | undefined)
    .catch(() => undefined);

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

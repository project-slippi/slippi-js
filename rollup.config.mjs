import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";
import { readdirSync } from "fs";
import { join } from "path";

// ============================================
// Helper Functions
// ============================================

/**
 * Automatically discover all TypeScript files in a directory
 */
function discoverFiles(dir, prefix = "") {
  const entries = {};
  const files = readdirSync(join("src", dir), { withFileTypes: true });

  for (const file of files) {
    if (file.isFile() && file.name.endsWith(".ts") && !file.name.endsWith(".d.ts")) {
      const name = file.name.replace(".ts", "");
      const key = prefix ? `${prefix}/${name}` : name;
      entries[key] = `src/${dir}/${file.name}`;
    }
  }
  return entries;
}

/**
 * Create standardized external function
 */
const createExternal =
  (additionalChecks = []) =>
  (id) => {
    // Externalize node_modules
    if (id.includes("node_modules")) return true;

    // Don't externalize source files
    if (
      id.startsWith(".") ||
      id.startsWith("/") ||
      id.startsWith("\\0") ||
      id.startsWith("src/") ||
      id.endsWith(".ts") ||
      id.endsWith(".tsx")
    ) {
      return false;
    }

    // Apply additional checks
    for (const check of additionalChecks) {
      if (check(id)) return true;
    }

    // Default: externalize package imports
    return true;
  };

/**
 * Create standardized output configuration
 */
const createOutput = (dir, format, preserveModules = true) => ({
  dir,
  format,
  entryFileNames: `[name].${format === "esm" ? "esm.js" : "cjs"}`,
  chunkFileNames: `[name].${format === "esm" ? "esm.js" : "cjs"}`,
  preserveModules,
  preserveModulesRoot: "src",
  sourcemap: true,
  exports: "named",
});

/**
 * Standard plugin configuration
 */
const createPlugins = (browser = false) => [
  typescript({
    tsconfig: "./tsconfig.json",
    declaration: false,
    declarationMap: false,
    declarationDir: null,
    composite: false,
    incremental: false,
  }),
  resolve({
    preferBuiltins: !browser,
    browser,
  }),
  json(),
  commonjs(),
];

export default defineConfig([
  // ============================================
  // Common Build (Shared code with preserved modules)
  // ============================================
  {
    input: {
      "index.common": "src/index.common.ts",
      SlippiGame: "src/SlippiGame.ts",
      "utils/bufferHelpers": "src/utils/bufferHelpers.ts",
      "utils/slpInputRef": "src/utils/slpInputRef.ts",
    },
    output: [createOutput("dist/common", "esm"), createOutput("dist/common", "cjs")],
    external: createExternal(),
    plugins: createPlugins(),
  },

  // ============================================
  // Node-specific Build (Auto-discovered files)
  // ============================================
  {
    input: {
      ...discoverFiles("console", "console"),
      ...discoverFiles("nodeUtils", "nodeUtils"),
    },
    output: [createOutput("dist/node", "esm", false), createOutput("dist/node", "cjs", false)],
    external: createExternal([
      // Externalize common modules
      (id) =>
        id.startsWith("./stats/") ||
        id.startsWith("./melee/") ||
        id.startsWith("./utils/") ||
        id === "./types" ||
        id.startsWith("../"),
    ]),
    plugins: createPlugins(),
  },

  // ============================================
  // TypeScript Declarations (Generated once)
  // ============================================
  {
    input: {
      index: "src/index.ts",
      "index.node": "src/index.node.ts",
      "index.common": "src/index.common.ts",
    },
    output: {
      dir: "dist",
      format: "esm",
    },
    external: createExternal(),
    plugins: [
      dts({
        respectExternal: true,
      }),
    ],
  },
]);

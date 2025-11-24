import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";

// ============================================
// Helper Functions
// ============================================

/**
 * Externalize npm packages and cross-directory imports
 */
const external = (id) => {
  // Don't externalize rollup helpers
  if (id.startsWith("\\0")) return false;

  // Normalize path separators for Windows compatibility
  const normalizedId = id.replace(/\\/g, "/");

  // Don't externalize source files (anything with "src/" or relative paths)
  if (normalizedId.includes("src/") || normalizedId.startsWith(".")) return false;

  // Externalize npm packages and cross-directory imports
  return true;
};

/**
 * Browser-specific external function that bundles certain dependencies
 */
const browserExternal = (id) => {
  // Bundle @shelacek/ubjson for browser builds
  if (id === "@shelacek/ubjson" || id.includes("@shelacek/ubjson")) return false;

  // Don't externalize rollup helpers
  if (id.startsWith("\\0")) return false;

  // Normalize path separators for Windows compatibility
  const normalizedId = id.replace(/\\/g, "/");

  // Don't externalize source files (anything with "src/" or relative paths)
  if (normalizedId.includes("src/") || normalizedId.startsWith(".")) return false;

  // Externalize other npm packages and cross-directory imports
  return true;
};

/**
 * Standard output configuration
 */
const createOutput = (dir, format) => ({
  dir,
  format,
  entryFileNames: `[name].${format === "esm" ? "esm.js" : "cjs"}`,
  chunkFileNames: `[name].${format === "esm" ? "esm.js" : "cjs"}`,
  preserveModules: true,
  preserveModulesRoot: "src",
  sourcemap: true,
  exports: "named",
});

/**
 * Browser output configuration (bundled to include dependencies)
 */
const createBrowserOutput = (dir, format) => ({
  dir,
  format,
  entryFileNames: `[name].${format === "esm" ? "esm.js" : "cjs"}`,
  chunkFileNames: `[name]-[hash].${format === "esm" ? "esm.js" : "cjs"}`,
  sourcemap: true,
  exports: "named",
});

/**
 * Standard plugin configuration
 */
const plugins = [
  typescript({
    tsconfig: "./tsconfig.json",
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      declarationDir: undefined,
    },
  }),
  resolve({ preferBuiltins: true }),
  json(),
  commonjs(),
];

/**
 * Browser-specific plugin configuration
 */
const browserPlugins = [
  typescript({
    tsconfig: "./tsconfig.json",
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      declarationDir: undefined,
    },
  }),
  resolve({
    preferBuiltins: false,
    browser: true,
  }),
  json(),
  commonjs({
    include: /node_modules/,
  }),
  // Replace require("util") with browser globals after bundling
  // This handles the @shelacek/ubjson package's fallback to require("util")
  replace({
    preventAssignment: false,
    delimiters: ["", ""],
    values: {
      'require("util")': "{}",
      "require('util')": "{}",
    },
  }),
];

export default defineConfig([
  // ============================================
  // Browser Build (bundled with dependencies)
  // ============================================
  {
    input: { "browser/index": "src/browser/index.ts" },
    output: [createBrowserOutput("dist", "esm"), createBrowserOutput("dist", "cjs")],
    external: browserExternal,
    plugins: browserPlugins,
  },

  // ============================================
  // Node Build (includes common + node via imports)
  // ============================================
  {
    input: { "node/index": "src/node/index.ts" },
    output: [createOutput("dist", "esm"), createOutput("dist", "cjs")],
    external,
    plugins,
  },

  // ============================================
  // TypeScript Declarations
  // ============================================
  {
    input: {
      index: "src/browser/index.ts",
      "index.node": "src/node/index.ts",
    },
    output: { dir: "dist", format: "esm" },
    external,
    plugins: [
      dts({
        // Remove respectExternal: true as it can cause the plugin to hang
        // when trying to resolve complex type dependencies.
        // The external function already handles what should be externalized.
        compilerOptions: {
          // Skip lib checks to speed up type resolution
          skipLibCheck: true,
        },
      }),
    ],
  },
]);

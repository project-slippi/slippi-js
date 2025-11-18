import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";
import { globSync } from "glob";

// ============================================
// Helper Functions
// ============================================

/**
 * Convert glob matches to Rollup input format
 */
const globToInput = (pattern, removePrefix = "src/") => {
  return Object.fromEntries(
    globSync(pattern, { ignore: ["**/*.spec.ts", "**/*.test.ts"] }).map((file) => {
      const key = file.replace(removePrefix, "").replace(/\.ts$/, "");
      return [key, file];
    }),
  );
};

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

export default defineConfig([
  // ============================================
  // Common Build (Shared browser/node code)
  // ============================================
  {
    input: globToInput("src/common/**/*.ts"),
    output: [createOutput("dist", "esm"), createOutput("dist", "cjs")],
    external,
    plugins,
  },

  // ============================================
  // Node-specific Build
  // ============================================
  {
    input: globToInput("src/node/**/*.ts"),
    output: [createOutput("dist", "esm"), createOutput("dist", "cjs")],
    external,
    plugins,
  },

  // ============================================
  // Browser Build
  // ============================================
  {
    input: { "browser/index": "src/browser/index.ts" },
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
      "index.common": "src/common/index.ts",
    },
    output: { dir: "dist", format: "esm" },
    external,
    plugins: [dts({ respectExternal: true })],
  },
]);

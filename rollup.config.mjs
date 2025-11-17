import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";

// External dependencies for Node builds
const nodeExternal = (id) => {
  // If it's from node_modules, externalize it
  if (id.includes("node_modules")) {
    return true;
  }
  // If it's a relative or absolute path, or our source files, don't externalize
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
  // Otherwise, it's a package import - externalize it
  return true;
};

// External dependencies for Browser builds (same as Node - externalize everything)
const browserExternal = nodeExternal;

// Shared plugins for JavaScript builds
const sharedPlugins = [
  resolve({
    preferBuiltins: true,
    browser: false, // We'll set this per-build
  }),
  json(),
  commonjs(),
];

// Browser-specific plugins
const browserPlugins = [
  resolve({
    preferBuiltins: false,
    browser: true,
  }),
  json(),
  commonjs(),
];

export default defineConfig([
  // ============================================
  // Node Build (ESM + CJS)
  // ============================================
  {
    input: "src/index.node.ts",
    output: [
      // Node ESM with preserved modules
      {
        dir: "dist/node",
        format: "esm",
        entryFileNames: "[name].esm.js",
        chunkFileNames: "[name].esm.js",
        preserveModules: true,
        preserveModulesRoot: "src",
        sourcemap: true,
      },
      // Node CJS development
      {
        dir: "dist/node",
        format: "cjs",
        entryFileNames: "index.node.cjs.development.js",
        sourcemap: true,
        exports: "named",
      },
      // Node CJS production (minified)
      {
        dir: "dist/node",
        format: "cjs",
        entryFileNames: "index.node.cjs.production.min.js",
        sourcemap: true,
        exports: "named",
        plugins: [
          // Add terser for minification if needed
          // You can add @rollup/plugin-terser here
        ],
      },
    ],
    external: nodeExternal,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false,
        declarationDir: null,
        composite: false,
        incremental: false,
      }),
      ...sharedPlugins,
    ],
  },

  // ============================================
  // Browser Build (ESM + CJS)
  // ============================================
  {
    input: "src/index.ts",
    output: [
      // Browser ESM bundle
      {
        file: "dist/slippi-js.esm.js",
        format: "esm",
        sourcemap: true,
      },
      // Browser CJS development
      {
        dir: "dist/browser",
        format: "cjs",
        entryFileNames: "slippi-js.cjs.development.js",
        sourcemap: true,
        exports: "named",
      },
      // Browser CJS production
      {
        dir: "dist/browser",
        format: "cjs",
        entryFileNames: "slippi-js.cjs.production.min.js",
        sourcemap: true,
        exports: "named",
      },
    ],
    external: browserExternal,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false,
        declarationDir: null,
        composite: false,
        incremental: false,
      }),
      ...browserPlugins,
    ],
  },

  // ============================================
  // TypeScript Declarations (Generated ONCE)
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
    external: nodeExternal,
    plugins: [
      dts({
        respectExternal: true,
      }),
    ],
  },
]);

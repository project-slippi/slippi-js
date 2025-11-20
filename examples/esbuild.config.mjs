import * as esbuild from "esbuild";

// Polyfill plugin as a fallback in case any package tries to import 'util'
// The library should have ubjson bundled, but this provides defense in depth
const nodeBuiltinsPlugin = {
  name: "node-builtins",
  setup(build) {
    build.onResolve({ filter: /^util$/ }, (args) => {
      return { path: args.path, namespace: "node-builtins" };
    });

    build.onLoad({ filter: /.*/, namespace: "node-builtins" }, (args) => {
      if (args.path === "util") {
        return {
          contents: `
            export const TextEncoder = globalThis.TextEncoder;
            export const TextDecoder = globalThis.TextDecoder;
          `,
        };
      }
    });
  },
};

await esbuild.build({
  entryPoints: ["src/browser-stream-test.ts"],
  bundle: true,
  outfile: "browser-test/bundle.js",
  platform: "browser",
  target: "es2020",
  sourcemap: true,
  plugins: [nodeBuiltinsPlugin],
  logLevel: "info",
});

console.log("✅ Browser bundle built successfully!");

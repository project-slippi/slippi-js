import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/browser-stream-test.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  platform: "browser",
  target: "es2020",
  sourcemap: false,
  logLevel: "info",
});

console.log("✅ Browser bundle built successfully!");

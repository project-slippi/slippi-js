const fs = require("fs");
const path = require("path");

// Custom plugin to generate Node.js entry file
function generateNodeEntry() {
  return {
    name: "generate-node-entry",
    writeBundle(options, bundle) {
      // Only run for CJS development builds (skip production and ESM)
      if (options.format !== "cjs" || !options.entryFileNames?.includes("development")) {
        return;
      }

      // Only run for Node.js builds
      const isNodeBuild = options.name?.includes("node");
      if (!isNodeBuild) return;

      // Extract the build name from options.name
      const fileName = options.name || "index.node";

      // Generate the entry file content
      const entryContent = `'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${fileName}.cjs.production.min.js')
} else {
  module.exports = require('./${fileName}.cjs.development.js')
}
`;

      // Write the entry file directly to the filesystem
      const entryPath = path.join(options.dir, `${fileName}.js`);
      fs.writeFileSync(entryPath, entryContent, "utf8");

      console.log(`✓ Generated Node.js entry: ${fileName}.js`);
    },
  };
}

module.exports = {
  rollup(config, opts) {
    // Get the source file from environment variable or default
    const source = process.env.DTS_SOURCE || "./src/index.ts";

    if (opts.format === "esm") {
      // Only preserve modules for Node builds, bundle browser builds
      if (opts.target === "node") {
        config.output = {
          ...config.output,
          dir: "dist/",
          entryFileNames: "[name].esm.js",
          preserveModules: true,
        };
        delete config.output.file;
      }
      // For browser builds, create a single bundle
    }

    // Add the Node.js entry generator plugin for Node builds
    if (opts.target === "node") {
      config.plugins = config.plugins || [];
      config.plugins.push(generateNodeEntry());
    }

    // Set the input source
    config.input = source;

    return config;
  },
};

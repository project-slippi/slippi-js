module.exports = {
  rollup(config, opts) {
    // Get the source file from environment variable or default
    const source = process.env.DTS_SOURCE || "./src/index.ts";

    if (opts.format === "esm") {
      config.output = {
        ...config.output,
        dir: "dist/",
        entryFileNames: "[name].esm.js",
        preserveModules: true,
      };
      delete config.output.file;
    }

    // Set the input source
    config.input = source;

    return config;
  },
};

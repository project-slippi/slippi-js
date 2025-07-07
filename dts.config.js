module.exports = {
  rollup(config, opts) {
    if (opts.format === "esm") {
      config.output = {
        ...config.output,
        dir: "dist/",
        entryFileNames: "[name].esm.js",
        preserveModules: true,
      };
      delete config.output.file;
    }
    return config;
  },
};

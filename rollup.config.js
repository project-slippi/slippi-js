import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import autoExternal from "rollup-plugin-auto-external";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

const externalPackages = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
// Creating regexes of the packages to make sure subpaths of the
// packages are also treated as external
const regexesOfPackages = externalPackages.map((packageName) => new RegExp(`^${packageName}(\/.*)?`));

export default {
  input: "src/index.ts",
  output: [
    {
      dir: "dist/cjs",
      format: "cjs",
    },
    {
      dir: "dist/esm",
      format: "esm",
      preserveModules: true,
    },
  ],
  external: regexesOfPackages,
  plugins: [
    autoExternal(),
    resolve(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
    }),
  ],
};

import resolve from "@rollup/plugin-node-resolve";
import autoExternal from "rollup-plugin-auto-external";
import typescript from "rollup-plugin-typescript2";

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
  plugins: [
    autoExternal(),
    resolve(),
    typescript({
      useTsconfigDeclarationDir: true,
    }),
  ],
};

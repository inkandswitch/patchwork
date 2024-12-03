import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const SHARED_DEPENDENCIES = [
  "@automerge/automerge",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
  "react",
  "react-dom",
  "react-dom/server",
  "react/jsx-runtime",
  "@patchwork/sdk",
];

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    json(),
    typescript({ tsconfig: "../../tsconfig.json" }),
    postcss({
      extensions: [".css"],
    }),
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: "auto", // needed to load some dependencies
    }),
  ],
  external: SHARED_DEPENDENCIES,
};

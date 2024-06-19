import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

const SHARED_DEPENDENCIES = [
  "@automerge/automerge",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
  "react",
  "react-dom",
  "react-dom/client",
  "react-dom/server",
  "react/jsx-runtime",
  "@patchwork/sdk",
];

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    // todo: find a better solution for this
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.REDUX_LOGGING": "false",
    }),
    resolve({
      browser: true, // we need this so node bundles like "crypto" are resolved correctly in the browser
    }),
    typescript({ tsconfig: "../../tsconfig.json" }),
    postcss({
      extensions: [".css"],
    }),
    commonjs(/*{
      include: /node_modules/,
      requireReturnsDefault: "auto", // this is needed to load some dependencies
    }*/),
    //terser(),
    json(),
  ],
  external: SHARED_DEPENDENCIES,
};

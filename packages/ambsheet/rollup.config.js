import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";

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
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    typescript({ tsconfig: "../../tsconfig.json" }),
    postcss({
      extensions: [".css"],
    }),
  ],
  external: SHARED_DEPENDENCIES,
};

import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

const SHARED_DEPENDENCIES = [
  "@automerge/automerge",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
  "react",
  "react-dom",
  "react-dom/server",
  "react/jsx-runtime",
  "@patchwork/sdk",
  "@patchwork/sdk/async-signals",
  "@patchwork/sdk/components",
  "@patchwork/sdk/hooks",
  "@patchwork/sdk/markdown",
  "@patchwork/sdk/router",
  "@patchwork/sdk/textAnchors",
  "@patchwork/sdk/ui",
  "@patchwork/sdk/utils",
  "@patchwork/sdk/versionControl",
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
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
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

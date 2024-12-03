import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";

// Shared dependencies
const SHARED_DEPENDENCIES = [
  "@automerge/automerge",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
  "react",
  "react-dom",
  "react-dom/server",
  "react/jsx-runtime",
];

// Shared plugins
const sharedPlugins = [
  resolve(),
  typescript({ tsconfig: "../tsconfig.json" }),
  postcss({ extensions: [".css"] }),
  commonjs({
    include: /node_modules/,
    requireReturnsDefault: "auto",
  }),
];

// Entry points and output mappings
const entryPoints = [
  "src/index.ts",
  "src/versionControl/index.ts",
  "src/ui/index.ts",
];
// Generate Rollup config for each entry point
const createConfig = (input) => ({
  input,
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
  plugins: sharedPlugins,
  external: SHARED_DEPENDENCIES,
});

export default entryPoints.map(createConfig);

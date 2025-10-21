import type { BuildOptions } from "esbuild";
import dynamicExternal from "./plugin-dynamic-external.ts";
import process from "node:process";
import { solid } from "./plugin-solid.ts";
import pushworkSync from "./plugin-pushwork-sync.ts";

export default {
  entryPoints: [
    "./src/index.tsx",
    "./src/module-settings.tsx",
    "./src/sideboard.tsx",
  ],
  outdir: "dist",
  bundle: true,
  platform: "browser",
  format: "esm",
  splitting: true,
  logLevel: "debug",
  sourcemap: true,
  plugins: [
    dynamicExternal(/^((@automerge\/automerge(-repo)?)|@patchwork\/.*)$/),
    solid(),
  ].concat(process.argv.includes("pushwork") ? pushworkSync() : []),
} satisfies BuildOptions;

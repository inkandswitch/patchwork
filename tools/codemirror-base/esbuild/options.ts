import type { BuildOptions } from "esbuild";
import dynamicExternal from "./plugin-dynamic-external.ts";
import process from "node:process";
import { solid } from "./plugin-solid.ts";
import pushworkSync from "./plugin-pushwork-sync.ts";
import pkgJSON from "../package.json" with { type: "json" };

const pushworking = process.argv.includes("pushwork") || process.env.PUSHWORK;

export default {
  entryPoints: Object.values(pkgJSON.exports).map((dsc) => dsc.source),
  outdir: "dist",
  bundle: true,
  platform: "browser",
  format: "esm",
  splitting: true,
  logLevel: "debug",
  sourcemap: false,
  plugins: [
    dynamicExternal(
      /^((@automerge\/automerge(-repo)?)|@patchwork\/.*|@codemirror\/.*|solid-js(\/.*)?)$/
    ),
    solid(),
  ].concat(pushworking ? pushworkSync() : []),
  loader: { ".ttf": "dataurl" },
} satisfies BuildOptions;

import type { BuildOptions } from "esbuild";
import process from "node:process";
import externals from "@patchwork/bootloader/externals";
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
  jsx: "automatic",
  jsxImportSource: "react",
  external: externals,
  plugins: pushworking ? [pushworkSync()] : [],
  loader: { ".ttf": "dataurl" },
} satisfies BuildOptions;

import type { BuildOptions, Plugin } from "esbuild";
import process from "node:process";
import { solid } from "./plugin-solid.ts";
import darnSync from "./plugin-darn-sync.ts";
import pkgJSON from "../package.json" with { type: "json" };
import { existsSync, rmSync } from "node:fs";
import externals from "@inkandswitch/patchwork-bootloader/externals";

const syncing = process.argv.includes("darn") || process.env.DARN_SYNC;

export default {
  entryPoints: Object.values(pkgJSON.exports)
    .filter((dsc) => typeof dsc == "object")
    .map((dsc) => dsc.source),
  outdir: "dist",
  bundle: true,
  platform: "browser",
  format: "esm",
  splitting: false,
  logLevel: "debug",
  sourcemap: !syncing,
  external: externals,
  minify: false,
  plugins: [
    solid(),
    {
      name: "empty outdir",
      setup(build) {
        build.onStart(() => {
          const { outdir, outfile } = build.initialOptions;
          if (outdir && existsSync(outdir)) rmSync(outdir, { recursive: true });
          if (outfile && existsSync(outfile)) rmSync(outfile);
        });
      },
    } satisfies Plugin,
  ].concat(syncing ? darnSync() : []),
  loader: { ".ttf": "dataurl" },
} satisfies BuildOptions;

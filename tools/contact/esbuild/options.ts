import type { BuildOptions, Plugin } from "esbuild";
import externals from "@inkandswitch/patchwork-bootloader/externals";
import process from "node:process";
import { existsSync, rmSync } from "node:fs";
import tailwind from "esbuild-plugin-tailwindcss";

import darnSync from "./plugin-darn-sync.ts";
import pkgJSON from "../package.json" with { type: "json" };

const syncing = process.argv.includes("darn") || process.env.DARN_SYNC;

export default {
  entryPoints: Object.values(pkgJSON.exports)
    .filter((dsc) => typeof dsc == "object" && "source" in dsc)
    .map((dsc) => dsc.source),
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
  plugins: [
    {
      name: "empty outdir",
      setup(build) {
        build.onStart(() => {
          const { outdir } = build.initialOptions;
          if (outdir && existsSync(outdir)) rmSync(outdir, { recursive: true });
        });
      },
    } satisfies Plugin,
    {
      // CJS packages like use-sync-external-store do require("react") which
      // esbuild wraps in a __require shim that throws in the browser.
      // Intercept these require-calls and resolve them to a virtual ESM
      // wrapper that re-exports from the external ESM module, avoiding CJS.
      name: "cjs-external-to-esm",
      setup(build) {
        const externalSet = new Set(externals);
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.kind === "require-call" && externalSet.has(args.path)) {
            return {
              path: `__esm_shim__/${args.path}`,
              namespace: "cjs-esm-shim",
            };
          }
        });
        build.onLoad({ filter: /.*/, namespace: "cjs-esm-shim" }, (args) => {
          const pkg = args.path.replace("__esm_shim__/", "");
          return {
            contents: `export * from ${JSON.stringify(pkg)}; export { default } from ${JSON.stringify(pkg)};`,
            loader: "js",
          };
        });
      },
    } satisfies Plugin,
    tailwind(),
  ].concat(syncing ? [darnSync()] : []),
  loader: { ".ttf": "dataurl", ".css": "file" },
  conditions: ["style", "browser", "import"],
} satisfies BuildOptions;

import { build } from "esbuild";

await build({
  entryPoints: ["src/head.ts"],
  bundle: true,
  format: "iife",
  outfile: "dist/head.js",
  platform: "browser",
  target: "esnext",
});

import * as esbuild from "esbuild";

/** @params {string|undefined} [outfile] */
export default async function build(outfile) {
  return esbuild.build({
    absWorkingDir: import.meta.dirname,
    entryPoints: ["src/service-worker.js"],
    outfile: outfile,
    bundle: true,
    format: "iife",
    define: {
      CACHE_VERSION: JSON.stringify(`cache-${new Date().toISOString()}`),
    },
  });
}

if (import.meta.main) {
  build("dist/service-worker.js");
}

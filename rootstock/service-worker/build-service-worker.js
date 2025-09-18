import { build } from "esbuild";

await build({
  absWorkingDir: import.meta.dirname,
  entryPoints: ["src/service-worker.js"],
  outfile: "dist/service-worker.js",
  bundle: true,
  format: "iife",
  define: {
    CACHE_VERSION: JSON.stringify(`cache-${new Date().toISOString()}`),
  },
});

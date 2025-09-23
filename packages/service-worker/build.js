import * as esbuild from "esbuild";

export default async function build() {
  const sw = esbuild.build({
    absWorkingDir: import.meta.dirname,
    entryPoints: ["./src/service-worker.ts"],
    outdir: "dist",
    bundle: true,
    format: "iife",
    define: {
      CACHE_VERSION: JSON.stringify(`cache-${new Date().toISOString()}`),
    },
  });

  const setup = esbuild.build({
    absWorkingDir: import.meta.dirname,
    entryPoints: ["./src/setup-service-worker.ts"],
    outdir: "dist",
    bundle: true,
    format: "esm",
    define: {
      CACHE_VERSION: JSON.stringify(`cache-${new Date().toISOString()}`),
    },
  });

  return Promise.all([sw, setup]);
}

if (import.meta.main) {
  build();
}

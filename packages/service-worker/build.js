import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function build() {
  const sw = esbuild.build({
    absWorkingDir: import.meta.dirname,
    entryPoints: ["./src/service-worker.ts"],
    outdir: "dist",
    bundle: true,
    format: "iife",
    loader: {
      ".wasm": "file",
    },
    define: {
      CACHE_VERSION: JSON.stringify(`cache-${new Date().toISOString()}`),
    },
    plugins: [
      {
        name: "deduplicate-keyhive",
        setup(build) {
          // Force all @keyhive/keyhive imports to resolve to service-worker's node_modules
          build.onResolve({ filter: /@keyhive\/keyhive\/slim$/ }, (args) => {
            // Skip if it's already resolved to service-worker's node_modules
            if (args.resolveDir.includes("service-worker/node_modules")) {
              return null;
            }

            // Resolve to service-worker's copy
            return {
              path: path.resolve(
                __dirname,
                "node_modules/@keyhive/keyhive/pkg-slim/index.js"
              ),
            };
          });
        },
      },
    ],
  });

  const setup = esbuild.build({
    absWorkingDir: import.meta.dirname,
    entryPoints: ["./src/setup-service-worker.ts"],
    outdir: "dist",
    bundle: true,
    format: "esm",
    loader: {
      ".wasm": "file",
    },
    define: {
      CACHE_VERSION: JSON.stringify(`cache-${new Date().toISOString()}`),
    },
  });

  return Promise.all([sw, setup]);
}

if (import.meta.main) {
  build();
}

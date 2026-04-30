import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";
import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Force a single copy of @automerge/automerge across linked packages.
// Without this, the linked automerge-repo resolves its own node_modules copy,
// causing `Automerge.use()` to be called on a different module instance.
const automergeEntryDir = dirname(
  fileURLToPath(import.meta.resolve("@automerge/automerge"))
);

// Force a single copy of @automerge/automerge-subduction. Without this,
// automerge-repo's internal imports resolve a separate Wasm module instance,
// causing `_assertClass` failures ("expected instance of SedimentreeId2").
const subductionDir = dirname(
  fileURLToPath(import.meta.resolve("@automerge/automerge-subduction"))
);

export default defineConfig({
  plugins: [
    tailwindcss(),
    wasm(),
    patchwork({
      importmap: {
        imports: {
          DEV: "data:text/javascript,export%20const%20DEV%20=%20true;",
        },
      },
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  preview: {
    port: process.env.PORT ? +process.env.PORT : 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  resolve: {
    alias: {
      // Subpath aliases must come before the bare specifier (longest-prefix wins).
      "@automerge/automerge/slim": resolve(automergeEntryDir, "slim.js"),
      "@automerge/automerge": resolve(automergeEntryDir, "fullfat_bundler.js"),
      "@automerge/automerge-subduction/slim": resolve(subductionDir, "slim.js"),
      "@automerge/automerge-subduction": resolve(subductionDir, "web.js"),
    },
  },
  optimizeDeps: {
    // Prevent Vite from pre-bundling automerge-subduction (which ignores the
    // resolve alias and picks the bundler target whose .wasm import gets dropped).
    exclude: [
      "@automerge/automerge-subduction",
      "@automerge/automerge-subduction/slim",
    ],
  },
  build: {
    target: "firefox137",
    minify: false,
    sourcemap: true,
  },
});

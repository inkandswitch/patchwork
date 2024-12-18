import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

import { EXTERNAL_DEPENDENCIES } from "@patchwork/sdk/shared-dependencies";

export default defineConfig({
  base: "./",
  plugins: [topLevelAwait(), wasm(), react(), cssInjectedByJsPlugin()],

  build: {
    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
      input: "./src/index.ts",
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
      preserveEntrySignatures: "strict",
    },
  },
});

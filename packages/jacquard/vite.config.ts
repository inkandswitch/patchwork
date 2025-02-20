import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import dts from "vite-plugin-dts";
import { EXTERNAL_DEPENDENCIES } from "@patchwork/sdk/shared-dependencies";

export default defineConfig({
  base: "./",
  plugins: [topLevelAwait(), wasm(), react(), dts()],

  build: {
    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
      input: {
        index: "./src/index.ts",
        hooks: "./src/hooks.ts",
        components: "./src/components/index.ts",
        signals: "./src/signals.ts",
      },
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

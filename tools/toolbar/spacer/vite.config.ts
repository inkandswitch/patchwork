import externals from "@patchwork/bootloader/externals";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [],

  build: {
    rollupOptions: {
      external: externals,
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

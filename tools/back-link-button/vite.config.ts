import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), cssInjectedByJsPlugin()],

  build: {
    rollupOptions: {
      external(id) {
        // Make an exception for @patchwork/react
        if (id === "@patchwork/react") return false;
        return !!id.match(/^((@automerge\/automerge(-repo)?)|@patchwork\/.*)$/);
      },
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

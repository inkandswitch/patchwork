import solid from "vite-plugin-solid";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import tailwindcss from "@tailwindcss/vite";
import externals from "@inkandswitch/patchwork-bootloader/externals";

export default defineConfig({
  base: "./",
  plugins: [topLevelAwait(), solid(), tailwindcss(), cssInjectedByJsPlugin()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      external: externals,
      input: "./src/tool.tsx",
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

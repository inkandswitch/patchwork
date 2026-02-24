import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import externals from "@inkandswitch/patchwork-bootloader/externals";
import { toolPackage } from "@inkandswitch/patchwork-bootloader/vite/tool-package";

export default defineConfig({
  base: "./",
  plugins: [cssInjectedByJsPlugin(), toolPackage()],

  build: {
    emptyOutDir: true,
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

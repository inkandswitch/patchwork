import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), cssInjectedByJsPlugin()],
  build: {
    rollupOptions: {
      external(id) {
        // Don't externalize libraries that depend on react
        // these need to share the same instance of react as the tool
        if (id === "@patchwork/react" || id === "@patchwork/context-react")
          return false;

        // ... otherwise externalize all automerge-repo and @patchwork packages
        return !!id.match(/^((@automerge\/automerge(-repo)?)|@patchwork\/.*)$/);
      },
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

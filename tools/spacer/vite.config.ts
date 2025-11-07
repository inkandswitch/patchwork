import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [],

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

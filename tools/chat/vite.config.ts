import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin(), tailwindcss()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@automerge/automerge",
        "@automerge/automerge-repo",
        "@automerge/automerge-repo-react-hooks",
        "@patchwork/element",
        "@patchwork/filesystem",
        "@patchwork/plugins",
        "@patchwork/react",
      ],
    },
  },
});

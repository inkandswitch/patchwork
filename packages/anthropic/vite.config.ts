import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [topLevelAwait(), wasm(), cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "patchwork-anthropic",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["@patchwork/sdk"],
    },
  },
  worker: {
    plugins: () => [topLevelAwait(), wasm()],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import tsconfigPaths from "vite-tsconfig-paths";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), topLevelAwait(), wasm()],
  resolve: {
    alias: {
      process: "process/browser",
    },
  },
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        "async-signals": "src/async-signals/index.ts",
        components: "src/components/index.ts",
        hooks: "src/hooks/index.ts",
        markdown: "src/markdown/index.ts",
        router: "src/router/index.ts",
        textAnchors: "src/textAnchors/index.ts",
        ui: "src/ui/index.ts",
        versionControl: "src/versionControl/index.ts",
        utils: "src/utils.ts", // note this is different from the others
      },
      name: "PatchworkSDK",
      formats: ["es"],
      fileName: (format) => `index.js`,
    },
    rollupOptions: {
      plugins: [
        typescript({ tsconfig: "../tsconfig.json" }),
        postcss({ extensions: [".css"] }),
        commonjs({
          include: /node_modules/,
          requireReturnsDefault: "auto",
        }),
      ],
      external: [
        "react",
        "react-dom",
        "@automerge/automerge",
        "@automerge/automerge-repo",
        "@automerge/automerge-repo-react-hooks",
      ],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
  },
  define: {
    "import.meta.env": process.env,
  },
});

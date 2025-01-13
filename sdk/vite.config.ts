import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import tsconfigPaths from "vite-tsconfig-paths";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { EXTERNAL_DEPENDENCIES } from "./src/shared-dependencies";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    topLevelAwait(),
    wasm(),
    replace({ "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV) }),
  ],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        "async-signals": "src/async-signals/index.ts",
        components: "src/components/index.ts",
        files: "src/files/index.ts",
        hooks: "src/hooks/index.ts",
        om: "src/om.ts",
        markdown: "src/markdown/index.ts",
        router: "src/router/index.ts",
        textAnchors: "src/textAnchors/index.ts",
        ui: "src/ui/index.ts",
        versionControl: "src/versionControl/index.ts",
        utils: "src/utils.ts", // note this is different from the others
        "shared-dependencies": "src/shared-dependencies.ts",
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
      external: EXTERNAL_DEPENDENCIES,
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
      },
    },
  },
  define: {
    "import.meta.env": process.env,
  },
});

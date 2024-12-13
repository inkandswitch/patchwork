import react from "@vitejs/plugin-react";
import { UserConfig, defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

import { EXTERNAL_DEPENDENCIES } from "@patchwork/sdk/shared-dependencies";

export default defineConfig({
  base: "./",
  plugins: [topLevelAwait(), wasm(), react()],

  optimizeDeps: {
    exclude: ["@syntect/wasm"],
  },

  build: {
    minify: false,
    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
      input: {
        index: "./src/index.ts",
        datatype: "./src/datatype.ts",
      },
      output: {
        // We put index.css in dist instead of dist/assets so that we can link to fonts
        // using relative URLs like "./assets/font.woff2", which is the correct form
        // for deployment to trailrunner.
        assetFileNames: (assetInfo) => {
          // For all other assets, keep the default behavior
          return "assets/[name]-[hash][extname]";
        },
        entryFileNames: (chunkInfo) => {
          return "[name].js"; // Default behavior for other entries
        },
        exports: "named",
      },
      preserveEntrySignatures: "allow-extension",
    },
  },

  define: {
    "process.env": {
      NODE_ENV: "production",
    },
  },
} satisfies UserConfig);

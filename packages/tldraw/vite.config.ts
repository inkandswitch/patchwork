import react from "@vitejs/plugin-react";
import { UserConfig, mergeConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import sharedConfig from "../../vite.shared";
import { EXTERNAL_DEPENDENCIES } from "@patchwork/sdk/shared-dependencies";

export default mergeConfig(sharedConfig, {
  plugins: [topLevelAwait(), wasm(), react(), cssInjectedByJsPlugin()],

  build: {
    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
      input: "./src/index.ts",
      output: {
        // We put index.css in dist instead of dist/assets so that we can link to fonts
        // using relative URLs like "./assets/font.woff2", which is the correct form
        // for deployment to trailrunner.
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") {
            return "[name][extname]";
          }
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

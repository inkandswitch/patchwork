import react from "@vitejs/plugin-react";
import path from "path";
import { Plugin, UserConfig, mergeConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

import sharedConfig from "../../vite.shared";

// Dependencies that are shared with dynamically loaded packages
// actual url will be resolved by generateImportMapPlugin
const SHARED_DEPENDENCIES = [
  "@automerge/automerge",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
  "react",
  "react-dom",
  "react-dom/client",
  "react-dom/server",
  "react/jsx-runtime",
];

// Internal modules that are shared with dynamically loaded packages
const SHARED_MODULES = {
  "@patchwork/sdk": "./sdk/index.js",
  "@patchwork/sdk/async-signals": "./sdk/async-signals.js",
  "@patchwork/sdk/components": "./sdk/components.js",
  "@patchwork/sdk/hooks": "./sdk/hooks.js",
  "@patchwork/sdk/markdown": "./sdk/markdown.js",
  "@patchwork/sdk/router": "./sdk/router.js",
  "@patchwork/sdk/textAnchors": "./sdk/textAnchors.js",
  "@patchwork/sdk/ui": "./sdk/ui.js",
  "@patchwork/sdk/versionControl": "./sdk/versionControl.js",
  "@patchwork/datagrid": "./datagrid/index.js",
  "@patchwork/kanban": "./kanban/index.js",
  "@patchwork/tldraw": "./tldraw/index.js",
};

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
);

export default mergeConfig(sharedConfig, {
  plugins: [topLevelAwait(), wasm(), react()],

  optimizeDeps: {
    exclude: ["@syntect/wasm"],
  },

  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  build: {
    rollupOptions: {
      external: ["*.wasm", ...EXTERNAL_DEPENDENCIES],
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

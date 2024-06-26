// vite.config.ts
import { Generator } from "@jspm/generator";
import react from "@vitejs/plugin-react";
import { globSync } from "glob";
import { fileURLToPath } from "node:url";
import path from "path";
import { Plugin, defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

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
  "@patchwork/sdk": "./sdk.js",
};

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
);

// Generates an import map for the external dependencies
const generateImportMapPlugin: Plugin = {
  name: "shared-deps-import-map",
  async transformIndexHtml(html, { server }) {
    // do nothing in dev mode
    if (server) {
      return html;
    }

    // in build mode generate import map
    const generator = new Generator({
      debug: false,
      env: ["browser", "module"],
    });

    for (const dep of SHARED_DEPENDENCIES) {
      await generator.install(dep);
    }

    const importMap = generator.getMap();

    for (const [name, url] of Object.entries(SHARED_MODULES)) {
      importMap.imports[name] = url;
    }

    return {
      html,
      tags: [
        {
          tag: "script",
          attrs: {
            type: "importmap",
          },
          children: JSON.stringify(importMap, null, 2),
          injectTo: "head-prepend",
        },
      ],
    };
  },
};

export default defineConfig({
  base: "./",

  plugins: [topLevelAwait(), react(), generateImportMapPlugin],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@automerge/automerge-wasm": path.resolve(
        __dirname,
        "./src/vendor/automerge-wasm"
      ),
    },
  },

  optimizeDeps: {
    // This is necessary because otherwise `vite dev` includes two separate
    // versions of the JS wrapper. This causes problems because the JS
    // wrapper has a module level variable to track JS side heap
    // allocations, and initializing this twice causes horrible breakage
    exclude: [
      "@automerge/automerge-wasm",
      "@automerge/automerge-wasm/bundler/bindgen_bg.wasm",
      "@syntect/wasm",
    ],
  },

  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  build: {
    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
      input: {
        main: path.resolve(__dirname, "index.html"),
        sdk: path.resolve(__dirname, "src/sdk.ts"), // Added entrypoint for sdk.ts
        ...Object.fromEntries(
          globSync(
            path.resolve(__dirname, "src/datatypes/*/module.@(ts|js|tsx|jsx)")
          ).map((path) => {
            const datatypeId = path.split("/").slice(-2)[0];

            return [
              `dataType-${datatypeId}`,
              fileURLToPath(new URL(path, import.meta.url)),
            ];
          })
        ),
        ...Object.fromEntries(
          globSync(
            path.resolve(__dirname, "src/tools/*/module.@(ts|js|tsx|jsx)")
          ).map((path) => {
            const toolId = path.split("/").slice(-2)[0];

            return [
              `tool-${toolId}`,
              fileURLToPath(new URL(path, import.meta.url)),
            ];
          })
        ),
      },
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
          // output tools under "/tools"
          if (chunkInfo.name.startsWith("tool-")) {
            const typeId = chunkInfo.name.split("-")[1];
            return `tools/${typeId}.js`;
          }

          // output datatypes under "/dataTypes"
          if (chunkInfo.name.startsWith("dataType-")) {
            const typeId = chunkInfo.name.split("-")[1];
            return `dataTypes/${typeId}.js`;
          }

          // output sdk under "/sdk.js"
          if (chunkInfo.name === "sdk") {
            return `sdk.js`;
          }

          return "assets/[name]-[hash].js"; // Default behavior for other entries
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
});

// vite.config.ts
import react from "@vitejs/plugin-react";
import fs from "fs";
import { globSync } from "glob";
import { fileURLToPath } from "node:url";
import path from "path";
import { HtmlTagDescriptor, Plugin, defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import { Generator } from "@jspm/generator";

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

/* Generates an import map for the shared dependencies. Depending on wether we are in dev mode
 * or in build mode we have to do different things
 *
 * Dev mode:
 *
 * Esbuild is used in dev mode which doesn't handle external dependencies properly
 * (see: https://github.com/evanw/esbuild/issues/1927).
 *
 * - Don't externalize dependencies in main bundle of core
 * - Generate import map that links to the pre bundled dependencies that are linked from the main bundle
 *
 * Build mode:
 *
 * - Externalize shared dependencies
 * - Generate import map using jspm generator
 * */
const generateImportMapPlugin: Plugin = {
  name: "shared-deps-import-map",
  async transformIndexHtml(html, { server }) {
    if (server) {
      const hash = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "node_modules/.vite/deps/_metadata.json"),
          "utf-8"
        )
      ).browserHash;

      const importMap = { imports: { ...SHARED_MODULES } };

      for (const dep of SHARED_DEPENDENCIES) {
        importMap.imports[dep] = `/node_modules/.vite/deps/${dep.replace(
          /\//g,
          "_"
        )}.js?v=${hash}`;
      }

      const tags: HtmlTagDescriptor[] = [
        {
          tag: "script",
          attrs: {
            type: "importmap",
          },
          children: JSON.stringify(importMap, null, 2),
          injectTo: "head-prepend",
        },
      ];

      return { html, tags };
    }

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
    minify: false,

    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
      input: {
        main: path.resolve(__dirname, "index.html"),
        sdk: path.resolve(__dirname, "src/os/sdk.ts"), // Added entrypoint for sdk.ts
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

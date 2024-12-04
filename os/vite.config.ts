import { Generator } from "@jspm/generator";
import react from "@vitejs/plugin-react";
import { build } from "esbuild";
import { globSync } from "glob";
import { fileURLToPath } from "node:url";
import path from "path";
import { Plugin, UserConfig, mergeConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

import sharedConfig from "../vite.shared";

const SERVICE_WORKER_MODULE_ID = "/service-worker.js";
const SERVICE_WORKER_PATH = path.join(import.meta.dirname, "service-worker.js");

/**
 * This plugin builds the service worker in service-worker.js using esbuild
 *
 * The reason this is necessary is that Firefox does not support ES modules in
 * service workers so we need to build an IIFE script, but we don't want to
 * use IIFE everywhere else.
 */
function swPlugin(): Plugin {
  return {
    name: "service-worker-dev",
    enforce: "pre",
    apply: "serve",
    handleHotUpdate(ctx) {
      if (ctx.file === SERVICE_WORKER_PATH) {
        ctx.server.hot.send({
          type: "full-reload",
        });
        const module = ctx.server.moduleGraph.getModuleById(
          SERVICE_WORKER_MODULE_ID
        );
        if (module != null) {
          ctx.server.moduleGraph.invalidateModule(module);
        }
        return [];
      }
    },
    async resolveId(id) {
      if (id === SERVICE_WORKER_MODULE_ID) {
        return SERVICE_WORKER_MODULE_ID;
      }
      if (id === SERVICE_WORKER_PATH) {
        return SERVICE_WORKER_PATH;
      }
      return null;
    },
    async load(id) {
      if (id === SERVICE_WORKER_MODULE_ID || id === SERVICE_WORKER_PATH) {
        const result = await build({
          absWorkingDir: import.meta.dirname,
          entryPoints: ["service-worker.js"],
          bundle: true,
          format: "iife",
          write: false,
        });
        return result.outputFiles[0].text;
      }
      return null;
    },
  };
}

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
};

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
);

// Generates an import map for the external dependencies
const generateImportMapPlugin = (): Plugin => ({
  name: "shared-deps-import-map",
  async transformIndexHtml(html, { server }) {
    // do nothing in dev mode
    if (server) {
      return html;
    }

    // in build mode generate import map
    const generator = new Generator({
      env: ["browser", "module"],
    });

    for (const dep of SHARED_DEPENDENCIES) {
      await generator.install(dep);
    }

    const importMap = generator.getMap();

    if (!importMap.imports) {
      throw new Error("No imports object in generated import map");
    }

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
});

export default mergeConfig(sharedConfig, {
  plugins: [
    topLevelAwait(),
    wasm(),
    react(),
    generateImportMapPlugin(),
    swPlugin(),
  ],

  optimizeDeps: {
    exclude: ["@syntect/wasm"],
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
} satisfies UserConfig);

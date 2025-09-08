import { Generator } from "@jspm/generator";
import { build } from "esbuild";
import { execSync } from "child_process";
import path from "path";
import { Plugin, UserConfig, defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

import {
  SHARED_MODULES,
  EXTERNAL_DEPENDENCIES,
} from "../sdk/src/shared-dependencies";

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
          define: {
            CACHE_VERSION: `"cache-${Date.now()}"`, // Note the nested quotes for string
          },
        });
        return result.outputFiles[0].text;
      }
      return null;
    },
  };
}

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
      resolutions: {
        "@automerge/automerge": "@automerge/automerge@3.1.1",
        ...SHARED_MODULES,
      },
    });

    const mungedDeps = EXTERNAL_DEPENDENCIES.map((dep) => {
      if (dep === "@codemirror/view") {
        return "npm:@codemirror/view@6.36.3";
      }
      if (dep === "@automerge/automerge") {
        return "npm:@automerge/automerge@3.1.1";
      }
      return dep;
    });
    await generator.install(mungedDeps);
    const importMap = generator.getMap();

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

export default defineConfig({
  plugins: [wasm(), generateImportMapPlugin(), swPlugin()],

  worker: {
    format: "es",
    plugins: () => [wasm()],
  },

  build: {
    target: "es2022",
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: (id) => {
        // More precise external matching
        if (id === "@patchwork/sdk") return true;
        if (id.startsWith("@patchwork/sdk/")) return true;
        return EXTERNAL_DEPENDENCIES.includes(id);
      },
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      preserveEntrySignatures: "allow-extension",
    },
  },

  define: {
    "process.env": {
      NODE_ENV: "production",
    },
    __PATCHWORK_VERSION__: JSON.stringify({
      gitHash: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
      buildTimestamp: Date.now(),
    }),
  },
} satisfies UserConfig);

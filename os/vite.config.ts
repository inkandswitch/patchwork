import { build } from "esbuild";
import { execSync } from "child_process";
import path from "path";
import { Plugin, UserConfig, defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

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

export default defineConfig({
  plugins: [wasm(), swPlugin()],

  worker: {
    format: "es",
    plugins: () => [wasm()],
  },

  build: {
    target: "firefox137",
    minify: false,
    sourcemap: true,
    rollupOptions: {
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
    __ROOTSTOCK_VERSION__: JSON.stringify({
      gitHash: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
      buildTimestamp: Date.now(),
    }),
  },
} satisfies UserConfig);

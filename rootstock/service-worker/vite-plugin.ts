import { build } from "esbuild";
import path from "node:path";
import { Plugin } from "vite";

export interface RootstockServiceWorkerPluginOptions {
  moduleId: string;
  path: string;
}

/**
 * This plugin builds the service worker in service-worker.js using esbuild
 *
 * The reason this is necessary is that Firefox does not support ES modules in
 * service workers so we need to build an IIFE script, but we don't want to
 * use IIFE everywhere else.
 */
export default function rootstockServiceWorkerPlugin(
  options: RootstockServiceWorkerPluginOptions = {
    moduleId: "/service-worker.js",
    path: path.join(import.meta.dirname, "service-worker.js"),
  }
): Plugin {
  return {
    name: "service-worker-dev",
    enforce: "pre",
    apply: "serve",
    handleHotUpdate(ctx) {
      if (ctx.file === options.path) {
        ctx.server.hot.send({
          type: "full-reload",
        });
        const module = ctx.server.moduleGraph.getModuleById(options.moduleId);
        if (module != null) {
          ctx.server.moduleGraph.invalidateModule(module);
        }
        return [];
      }
    },
    async resolveId(id) {
      if (id === options.moduleId) {
        return options.moduleId;
      }
      if (id === options.path) {
        return options.path;
      }
      return null;
    },
    async load(id) {
      if (id === options.moduleId || id === options.path) {
        const result = await build({
          absWorkingDir: import.meta.dirname,
          entryPoints: ["service-worker.js"],
          bundle: true,
          format: "iife",
          write: false,
          define: {
            CACHE_VERSION: JSON.stringify(`cache-${Date.now()}`),
          },
        });
        return result.outputFiles[0].text;
      }
      return null;
    },
  };
}

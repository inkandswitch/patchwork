import build from "./build.js";
import path from "node:path";

export interface RootstockServiceWorkerPluginOptions {
  /** The path to the service worker source file (its real loc on disk) */
  path: string;
}

const MODULE_ID = "/service-worker.js";
const DEFAULT_PATH_TO_SERVICE_WORKER = path.join(
  import.meta.dirname,
  "src",
  "service-worker.js"
);

/**
 * This plugin builds the service worker in service-worker.js using esbuild
 *
 * The reason this is necessary is that Firefox does not support ES modules in
 * service workers so we need to build an IIFE script, but we don't want to
 * use IIFE everywhere else.
 * @param {RootstockServiceWorkerPluginOptions} options
 * @returns {import("vite").Plugin}
 */
export default function rootstockServiceWorkerPlugin(
  options: RootstockServiceWorkerPluginOptions = {
    path: DEFAULT_PATH_TO_SERVICE_WORKER,
  }
): import("vite").Plugin {
  return {
    name: "service-worker-dev",
    enforce: "pre",
    apply: "serve",
    handleHotUpdate(ctx) {
      if (ctx.file === options.path) {
        ctx.server.hot.send({
          type: "full-reload",
        });
        const module = ctx.server.moduleGraph.getModuleById(MODULE_ID);
        //console.log({ module });
        if (module != null) {
          ctx.server.moduleGraph.invalidateModule(module);
        }
        return [];
      }
    },
    async resolveId(id) {
      if (id === MODULE_ID) {
        return MODULE_ID;
      }
      if (id === options.path) {
        return options.path;
      }
      return null;
    },
    async load(id) {
      if (id === MODULE_ID || id === options.path) {
        const result = await build();
        return result[0].outputFiles?.[0].text;
      }
      return null;
    },
  };
}

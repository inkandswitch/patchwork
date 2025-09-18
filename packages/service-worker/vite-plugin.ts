import build from "./build.js";
import path from "node:path";

export interface RootstockServiceWorkerPluginOptions {
  /** The vite module ID for the service worker (how it is imported) */
  moduleId: string;
  /** The path to the service worker source file (its real loc on disk) */
  path: string;
}

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
    moduleId: "/service-worker.js",
    path: path.join(import.meta.dirname, "src", "service-worker.js"),
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
        const module = ctx.server.moduleGraph.getModuleById(options.moduleId);
        //console.log({ module });
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
        const result = await build();
        return result.outputFiles?.[0].text;
      }
      return null;
    },
  };
}

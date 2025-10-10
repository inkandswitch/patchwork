import type { Plugin, ResolvedBuildOptions } from "vite";
import * as esbuild from "esbuild";
import { getBuildOptions } from "./generate.js";
import * as path from "node:path";
import { createReadStream } from "node:fs";

type Imports = { [name: string]: string };
type ImportMap = { imports: Imports; scopes?: { [scope: string]: Imports } };

export interface PatchworkVitePluginOptions {
  /** the wss:// syncServer URL that'll be connected to in the service-worker */
  syncServerUrl: string;
  /** the storage id for the syncServer, subscribed to in the main thread */
  syncServerStorageId: string;
  /** extra importmap to be merged into the index.html */
  importmap?: ImportMap;
  extraBuiltins?: Record<string, string>;
  /** currently unused */
  serviceWorkerType?: "classic" | "module";
  /** currently unused */
  keyhiveEnabled?: boolean;
}

export default function patchwork(options: PatchworkVitePluginOptions) {
  return [plugin(options)];
}

/**
 * these dependencies will be built into the outdir, and injected into the importmap
 */
export const defaultBuiltins = {
  "@automerge/automerge": "/packages/@automerge/automerge/index.js",
  "@automerge/automerge/slim": "/packages/@automerge/automerge/slim.js",
  "@automerge/automerge-repo": "/packages/@automerge/automerge-repo/index.js",
  "@automerge/automerge-repo/slim":
    "/packages/@automerge/automerge-repo/slim.js",
  "@automerge/vanillajs": "/packages/@automerge/vanillajs/index.js",
  "@automerge/vanillajs/slim": "/packages/@automerge/vanillajs/slim.js",
  "@keyhive/keyhive": "/packages/@keyhive/keyhive/index.js",
  "@keyhive/keyhive/slim": "/packages/@keyhive/keyhive/slim.js",
  "@keyhive/keyhive/keyhive_wasm.base64.js":
    "/packages/@keyhive/keyhive/keyhive_wasm.base64.js",
};

async function generateJavaScript(options: esbuild.BuildOptions) {
  const rb = await esbuild.build({
    ...options,
    write: false,
    outdir: ".",
  });
  const code = rb.outputFiles?.find((x) => x.path.endsWith(".js"))?.text;
  if (code) return { code };
}

/**
 * merge the importmap option with our builtins
 */
function createImportMap(options: PatchworkVitePluginOptions) {
  const builtins = Object.assign(
    {},
    defaultBuiltins,
    options.extraBuiltins ?? {}
  );
  const importmap: ImportMap = structuredClone(
    options.importmap ?? { imports: {}, scopes: {} }
  );
  importmap.imports ??= {};
  importmap.scopes ??= {};
  Object.assign(importmap.imports, builtins);
  return { importmap, builtins };
}

export function plugin(options: PatchworkVitePluginOptions): Plugin {
  const { importmap, builtins } = createImportMap(options);

  const serviceWorkerModuleId = "service-worker.js";
  const serviceWorkerSource = path.resolve(
    import.meta.dirname,
    "../template/service-worker/service-worker.ts"
  );

  const automergeWasmSource = path.resolve(
    import.meta.dirname,
    "../node_modules/@automerge/automerge/dist/automerge.wasm"
  );

  // https://vite.dev/guide/api-plugin.html#importing-a-virtual-file
  const patchworkSetupModuleId = "virtual:patchwork/setup";
  const resolvedPatchworkSetupModuleId = "\0" + patchworkSetupModuleId;
  const patchworkSetupSource = path.resolve(
    import.meta.dirname,
    "../template/client/setup.ts"
  );

  const sharedOptions = getBuildOptions({
    keyhiveEnabled: Boolean(options.keyhiveEnabled),
    syncServerStorageId: options.syncServerStorageId,
    syncServerUrl: options.syncServerUrl,
    serviceWorkerPath: serviceWorkerModuleId,
  });

  const serviceWorkerBuildOptions = {
    ...sharedOptions,
    entryPoints: [serviceWorkerSource],
    bundle: options.serviceWorkerType != "module",
    format: options.serviceWorkerType == "module" ? "esm" : "iife",
    minify: true,
    sourcemap: "external",
  } satisfies esbuild.BuildOptions as esbuild.BuildOptions;

  const patchworkSetupBuildOptions = {
    ...sharedOptions,
    format: "esm",
    entryPoints: [patchworkSetupSource],
    bundle: false,
  } satisfies esbuild.BuildOptions as esbuild.BuildOptions;

  let viteBuildInfo: ResolvedBuildOptions;

  function shouldPlaceholdKeyhive(id: string) {
    // if keyhive is disabled,
    // but the setup code is still importing keyhive,
    // then we should emit an empty keyhive file so the build works
    return (
      (!options.keyhiveEnabled && id.startsWith("@keyhive/")) ||
      [
        "@automerge/automerge-keyhive-network-adapter",
        "@automerge/automerge-repo-keyhive",
      ].includes(id)
    );
  }

  return {
    name: "@patchwork/vite",
    async buildStart() {
      if (this.environment.mode == "build") {
        for (const [id, fileName] of Object.entries(builtins)) {
          if (shouldPlaceholdKeyhive(id)) {
            continue;
          }
          this.emitFile({
            type: "chunk",
            fileName: fileName.slice(1),
            id,
            preserveSignature: "strict",
          });
        }
        this.emitFile({
          type: "asset",
          fileName: "automerge.wasm",
          source: await this.fs.readFile(automergeWasmSource),
        });
      }
    },
    resolveId(id) {
      if (id == `/${serviceWorkerModuleId}` || id == serviceWorkerModuleId) {
        return serviceWorkerModuleId;
      } else if (id == patchworkSetupModuleId) {
        return resolvedPatchworkSetupModuleId;
      } else if (shouldPlaceholdKeyhive(id)) {
        return id;
      }
    },
    async load(id) {
      if (id == resolvedPatchworkSetupModuleId) {
        return generateJavaScript(patchworkSetupBuildOptions);
      } else if (id == serviceWorkerModuleId) {
        return generateJavaScript(serviceWorkerBuildOptions);
      } else if (shouldPlaceholdKeyhive(id)) {
        return "export default {}";
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (ctx.server) {
          // serve builtins from dev server in dev mode
          for (const id of Object.keys(builtins)) {
            importmap.imports[id] = `/@id/${id}`;
          }
        }
        return {
          html,
          tags: [
            {
              tag: "script",
              attrs: { type: "importmap" },
              children: JSON.stringify(importmap, null, 2),
            },
          ],
        };
      },
    },
    configResolved(config) {
      viteBuildInfo = config.build;
    },
    configureServer: {
      handler(server) {
        server.middlewares.use((request, response, next) => {
          const url = new URL(request.url!, "http://example.com");
          if (url.pathname == "/automerge.wasm") {
            response.setHeaders(
              new Headers({
                "content-type": "application/wasm",
              })
            );
            createReadStream(automergeWasmSource).pipe(response);
          } else {
            next();
          }
        });
      },
    },
    closeBundle: {
      sequential: true,
      async handler(error) {
        if (error) {
          throw error;
        }
        await esbuild.build({
          ...serviceWorkerBuildOptions,
          outfile: path.resolve(viteBuildInfo.outDir, "service-worker.js"),
        });
      },
    },
  };
}

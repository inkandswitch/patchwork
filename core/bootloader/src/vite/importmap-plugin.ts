import type { Plugin } from "vite";
import type {
  ImportMap,
  PatchworkVitePluginOptions,
} from "./patchwork-plugin.js";

/**
 * these dependencies will be built into the outdir,
 * and injected into the importmap
 */
import externals from "../externals.js";

export const builtins = externals.reduce(
  (builtins, name) => ((builtins[name] = `/packages/${name}.js`), builtins),
  {} as Record<string, string>
);

/**
 * merge the importmap option with our builtins
 */
function createImportMap(options?: PatchworkVitePluginOptions) {
  const importmap: ImportMap = structuredClone(
    options?.importmap ?? { imports: {}, scopes: {} }
  );
  importmap.imports ??= {};
  importmap.scopes ??= {};
  Object.assign(importmap.imports, builtins);
  return { importmap, builtins };
}

export function importmap(options?: PatchworkVitePluginOptions): Plugin {
  const { importmap, builtins } = createImportMap(options);
  return {
    name: "@patchwork/vite",
    async buildStart() {
      if (this.environment.mode == "build") {
        for (const [id, fileName] of Object.entries(builtins)) {
          this.emitFile({
            type: "chunk",
            fileName: fileName.slice(1),
            id,
            preserveSignature: "strict",
          });
        }
      }
    },
    resolveId(id) {
      if (id in importmap.imports && !(id in builtins)) {
        return { id: importmap.imports[id], external: true };
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const map = structuredClone(importmap);
        if (ctx.server) {
          // serve builtins from dev server in dev mode
          for (const id of Object.keys(builtins)) {
            map.imports[id] = `/@id/${id}`;
          }
        }
        return {
          html,
          tags: [
            {
              tag: "script",
              attrs: { type: "importmap" },
              children: JSON.stringify(map, null, 2),
            },
          ],
        };
      },
    },
  };
}

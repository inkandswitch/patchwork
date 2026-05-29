import type { Plugin } from "vite";
import type {
  ImportMap,
  PatchworkVitePluginOptions,
} from "./patchwork-plugin.js";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

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
      for (const [id, fileName] of Object.entries(builtins)) {
        this.emitFile({
          type: "chunk",
          fileName: fileName.slice(1),
          id,
          preserveSignature: "strict",
        });
      }

      // Emit automerge, keyhive, and subduction wasm so the service worker can fetch them
      const automergeWasmPath = require.resolve(
        "@automerge/automerge/automerge.wasm"
      );
      this.emitFile({
        type: "asset",
        fileName: "automerge.wasm",
        source: readFileSync(automergeWasmPath),
      });
      const keyhiveWasmPath = require.resolve(
        "@keyhive/keyhive/keyhive_wasm.wasm"
      );
      this.emitFile({
        type: "asset",
        fileName: "keyhive_wasm.wasm",
        source: readFileSync(keyhiveWasmPath),
      });

      // Emit subduction wasm so the service worker can fetch it
      const subdWasmPath =
        require.resolve("@automerge/automerge-subduction/wasm");
      this.emitFile({
        type: "asset",
        fileName: "subduction.wasm",
        source: readFileSync(subdWasmPath),
      });
    },
    resolveId(id) {
      if (id in importmap.imports && !(id in builtins)) {
        return { id: importmap.imports[id], external: true };
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
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
  };
}

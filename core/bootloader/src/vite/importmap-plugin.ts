import type { Plugin } from "vite";
import type {
  ImportMap,
  PatchworkVitePluginOptions,
} from "./patchwork-plugin.js";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
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
 * pretend the import came from inside this package, so node_modules resolution
 * walks up from *our* directory and finds our copy of each external. that's why
 * a consuming site never has to install them or agree with us about versions.
 */
const self = fileURLToPath(import.meta.url);

/**
 * resolve an external from our node_modules rather than the site's.
 *
 * this goes through rollup's resolver rather than import.meta.resolve or
 * require.resolve because those apply node's conditions: subduction (and
 * others) would hand us `dist/esm/node.js`, which imports node:path and blows
 * up at bundle time. rollup applies the browser conditions vite configured.
 */
async function resolveExternal(
  this: import("rollup").PluginContext,
  name: string
) {
  const resolved = await this.resolve(name, self, { skipSelf: true });
  if (!resolved) {
    throw new Error(
      `@patchwork/vite: couldn't resolve the external "${name}" from ` +
        `@inkandswitch/patchwork-bootloader. it should be one of the ` +
        `bootloader's own dependencies.`
    );
  }
  return resolved.id;
}

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
          id: await resolveExternal.call(this, id),
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
    async resolveId(id) {
      if (id in builtins) {
        // point the site's own imports at the same copy we emit as a chunk,
        // otherwise rollup bundles a second one out of the site's node_modules
        // and you end up with two automerges racing to init the same wasm
        return resolveExternal.call(this, id);
      }
      if (id in importmap.imports) {
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

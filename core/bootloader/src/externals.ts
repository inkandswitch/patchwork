import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/**
 * these dependencies will be built into the outdir, and injected into the importmap
 */
const externals = [
  "@automerge/automerge",
  "@automerge/automerge/slim",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo/slim",
  // Port-donation plumbing for WorkerWebSocketEndpoint: tabs spawn the shared
  // proxy entry and donate its port to the automerge worker (Chrome can't
  // spawn workers from inside a SharedWorker). See setup.ts/automerge-worker.ts.
  "@automerge/automerge-repo/worker-port",
  "@automerge/automerge-repo/subduction-websocket-worker-shared",
  "@automerge/automerge-repo-network-messagechannel",
  "@automerge/automerge-repo-network-websocket",
  "@automerge/automerge-repo-storage-indexeddb",
  "@automerge/automerge-repo-keyhive",
  "@automerge/automerge-subduction",
  "@automerge/automerge-subduction/slim",
  "@keyhive/keyhive",
  "@keyhive/keyhive/slim",
  "@inkandswitch/patchwork-bootloader",
  "@inkandswitch/patchwork-elements",
  "@inkandswitch/patchwork-filesystem",
  "@inkandswitch/patchwork-plugins",
  "@inkandswitch/patchwork-providers",

  // sad
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/language",
  "@codemirror/commands",

  // rip
  "solid-js",
  "solid-js/html",
  "solid-js/web",
  "solid-js/h",
  "solid-js/store",
  "solid-js/jsx-runtime",
];
export default externals;

/**
 * pretend the import came from inside this package, so node_modules resolution
 * walks up from *our* directory and finds our copy of each external. that's why
 * a consuming site never has to install them or agree with us about versions.
 */
const self = fileURLToPath(import.meta.url);

/**
 * Resolve one of this package's own dependencies from its node_modules
 * rather than the site's, so a vite plugin bundling it never needs the site
 * to install it or agree on a version. Exported so `@inkandswitch/patchwork`'s
 * vite plugin (which lives in a different package) can reuse this for the
 * externals bootloader actually owns, while resolving itself separately.
 *
 * This goes through rollup's resolver rather than import.meta.resolve or
 * require.resolve because those apply node's conditions: subduction (and
 * others) would hand us `dist/esm/node.js`, which imports node:path and blows
 * up at bundle time. rollup applies the browser conditions vite configured.
 */
export async function resolveExternal(
  this: import("rollup").PluginContext,
  name: string
): Promise<string> {
  const resolved = await this.resolve(name, self, { skipSelf: true });
  if (!resolved) {
    throw new Error(
      `@inkandswitch/patchwork-bootloader: couldn't resolve the external ` +
        `"${name}". it should be one of the bootloader's own dependencies.`
    );
  }
  return resolved.id;
}

/** Emits automerge/keyhive/subduction's wasm binaries as build assets, so the service worker can fetch them. */
export function emitWasmAssets(this: import("rollup").PluginContext): void {
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

  const subdWasmPath = require.resolve("@automerge/automerge-subduction/wasm");
  this.emitFile({
    type: "asset",
    fileName: "subduction.wasm",
    source: readFileSync(subdWasmPath),
  });
}

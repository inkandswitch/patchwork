/**
 * Host-side RPC handler for module loading.
 *
 * The iframe's `es-module-shims` source hook sends module URL requests to
 * the host via a MessagePort. The host resolves the URL and returns the
 * source text along with the resolved URL (so es-module-shims can use it
 * as the base for relative imports).
 *
 * For `automerge:` URLs (tool module packages), the handler:
 *  1. Converts to a service-worker-resolvable path
 *  2. Fetches `package.json` to find the entry point
 *  3. Resolves the entry point URL
 *  4. Fetches and returns the entry point source + resolved URL
 *
 * For regular URLs, the handler fetches directly and returns the
 * response URL (which may differ from the request URL after redirects).
 *
 * Protocol:
 *   iframe → host:  { type: "fetch-module", id: number, url: string }
 *   host → iframe:  { type: "fetch-module-response", id: number, source: string, resolvedUrl: string }
 *                   | { type: "fetch-module-error", id: number, error: string }
 */

import { isValidAutomergeUrl, type AutomergeUrl } from "@automerge/automerge-repo";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";

export interface ModuleRpcOptions {
  /** The MessagePort to communicate over. */
  port: MessagePort;
}

/**
 * Resolve an automerge: URL to its package entry point URL by reading
 * the package.json via the service worker.
 */
async function resolveAutomergeEntryUrl(
  automergeUrl: AutomergeUrl
): Promise<string> {
  const folderPath = getImportableUrlFromAutomergeUrl(automergeUrl);
  const base = new URL(folderPath, window.location.origin);
  const packageJsonUrl = new URL("package.json", base).href;

  const response = await fetch(packageJsonUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch package.json for ${automergeUrl}: ${response.status}`
    );
  }

  const pkgJson = await response.json();
  const entryPoint = resolvePackageExport(pkgJson);
  return new URL(entryPoint, base).href;
}

/**
 * Start handling module fetch requests on the given port.
 * Returns a cleanup function that removes the listener.
 */
export function startModuleRpc(options: ModuleRpcOptions): () => void {
  const { port } = options;

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (msg?.type !== "fetch-module") return;

    const { id, url } = msg as { id: number; url: string };

    try {
      let fetchUrl: string;

      if (isValidAutomergeUrl(url)) {
        // Resolve automerge: URL to its package entry point
        fetchUrl = await resolveAutomergeEntryUrl(url as AutomergeUrl);
      } else {
        fetchUrl = url;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        port.postMessage({
          type: "fetch-module-error",
          id,
          error: `HTTP ${response.status}: ${response.statusText} (${fetchUrl})`,
        });
        return;
      }

      const source = await response.text();
      port.postMessage({
        type: "fetch-module-response",
        id,
        source,
        // Return the resolved URL so es-module-shims uses it as the base
        // for relative imports within the module.
        resolvedUrl: response.url || fetchUrl,
      });
    } catch (err) {
      port.postMessage({
        type: "fetch-module-error",
        id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  port.addEventListener("message", onMessage);
  port.start();

  return () => {
    port.removeEventListener("message", onMessage);
  };
}

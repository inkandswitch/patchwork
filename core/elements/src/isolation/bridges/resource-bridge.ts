/**
 * Resource bridge — the host-side `fetch-package` / `fetch-resource` RPC.
 *
 * The sandboxed iframe has an opaque origin and can't reach the host's service
 * worker, so it can't load module source or static resources directly. This
 * bridge re-opens that channel over RPC: the iframe asks for a URL, the host
 * resolves it (via `resolveUrl`), fetches it, and returns the bytes.
 *
 *  - `fetch-package`: returns module source text + a resolved `pkg:` URL for
 *    es-module-shims
 *  - `fetch-resource`: returns an ArrayBuffer + content type for the iframe's
 *    fetch proxy
 *
 * Every incoming request is filtered by `containsAutomergeUrl` before
 * resolution, so a tool can't smuggle a raw automerge document ID through the
 * proxy to bypass the sync allowlist.
 */

import { log } from "../log.js";
import {
  type PackagesUrlMapper,
  containsAutomergeUrl,
  resolveUrl,
} from "./url-mapping.js";

export interface ResourceBridgeOptions {
  port: MessagePort;
  mapper: PackagesUrlMapper;
}

/**
 * Reject a fetch-proxy request whose URL contains a raw automerge document ID.
 * Posts the appropriate error message back to the iframe and logs host-side.
 * Returns true if the request was blocked (caller should return early).
 */
function rejectIfAutomerge(
  port: MessagePort,
  id: number,
  url: string,
  errorType: "fetch-package-error" | "fetch-resource-error"
): boolean {
  if (!containsAutomergeUrl(url)) return false;
  const error = `blocked: request contains an automerge URL (${url})`;
  log(`${errorType.replace("-error", "")} blocked ${url}`);
  port.postMessage({ type: errorType, id, error });
  return true;
}

/**
 * Shared skeleton for the two fetch-proxy RPC handlers. Both follow the same
 * path: reject raw-automerge URLs, resolve the requested URL, fetch it, and
 * post an error on failure. Only the success handling differs (module source
 * text + pkg: resolvedUrl vs. resource bytes + content type), so that is passed
 * in as `onResponse`, which is responsible for posting the success message
 * (the resource handler needs to transfer its ArrayBuffer).
 */
async function handleFetchRpc(
  msg: { id: number; url: string },
  type: "fetch-package" | "fetch-resource",
  port: MessagePort,
  mapper: PackagesUrlMapper,
  onResponse: (
    response: Response,
    fetchUrl: string,
    id: number
  ) => Promise<void> | void
): Promise<void> {
  const errorType = `${type}-error` as const;
  const { id, url } = msg;
  if (rejectIfAutomerge(port, id, url, errorType)) return;
  try {
    const fetchUrl = await resolveUrl(url, mapper);
    log(fetchUrl !== url ? `${type} ${url} → ${fetchUrl}` : `${type} ${url}`);

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      const error = `HTTP ${response.status}: ${response.statusText} (${fetchUrl})`;
      log(`${type} error ${url}: ${error}`);
      port.postMessage({ type: errorType, id, error });
      return;
    }
    // Awaited so a failure reading the body is caught by the catch below.
    await onResponse(response, fetchUrl, id);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    log(`${type} error ${url}: ${error}`);
    port.postMessage({ type: errorType, id, error });
  }
}

/**
 * Start the host-side resource bridge — the RPC handler for module and resource
 * loading.
 *
 * Handles two message types:
 *  - `fetch-package`: returns source text + resolved URL (for es-module-shims)
 *  - `fetch-resource`: returns ArrayBuffer + content type (for fetch proxy)
 */
export function startResourceBridge(options: ResourceBridgeOptions): () => void {
  const { port, mapper } = options;

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (!msg) return;

    if (msg.type === "fetch-package") {
      await handleFetchRpc(msg, "fetch-package", port, mapper, async (response, fetchUrl, id) => {
        const source = await response.text();
        // Convert the resolved URL back to a pkg: URL (hiding automerge IDs).
        // If it IS a pkg: URL, prefix with host origin so es-module-shims can
        // resolve relative imports (code-split chunks) against it — bare `pkg:`
        // URLs aren't valid hierarchical URLs. Already-absolute URLs (e.g.
        // host-origin asset paths) are returned as-is to avoid double-prefixing.
        const pkgUrl = mapper.toPackageUrl(response.url || fetchUrl);
        const resolvedUrl = pkgUrl.startsWith("pkg:")
          ? `${window.location.origin}/${pkgUrl}`
          : pkgUrl;
        port.postMessage({ type: "fetch-package-response", id, source, resolvedUrl });
      });
      return;
    }

    if (msg.type === "fetch-resource") {
      await handleFetchRpc(msg, "fetch-resource", port, mapper, async (response, _fetchUrl, id) => {
        const body = await response.arrayBuffer();
        const contentType =
          response.headers.get("content-type") || "application/octet-stream";
        // Transfer (not copy) the ArrayBuffer for efficiency.
        port.postMessage(
          { type: "fetch-resource-response", id, body, contentType },
          [body]
        );
      });
      return;
    }
  };

  port.addEventListener("message", onMessage);
  port.start();

  return () => {
    port.removeEventListener("message", onMessage);
  };
}

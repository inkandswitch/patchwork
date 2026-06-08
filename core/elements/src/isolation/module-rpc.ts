/**
 * Host-side RPC handler for module and resource loading.
 *
 * Handles two RPC types:
 *
 * **`fetch-module`** — for es-module-shims source hook (JS modules).
 *   Returns source text + resolved URL. Resolves automerge: URLs to
 *   package entry points. Converts pkg: URLs back to real paths.
 *
 * **`fetch-resource`** — for the iframe's fetch proxy (CSS, images, etc.).
 *   Returns ArrayBuffer + content type. Binary-safe. Converts pkg: URLs
 *   back to real paths via the PackageUrlMapper.
 */

import { isValidAutomergeUrl, type AutomergeUrl } from "@automerge/automerge-repo";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";
import type { PackageUrlMapper } from "./package-url-mapper.js";

export interface ModuleRpcOptions {
  port: MessagePort;
  mapper: PackageUrlMapper;
}

/**
 * Resolve an automerge: URL to its package entry point URL.
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
 * Resolve a URL for fetching:
 *  - pkg: URLs → convert to real automerge path via mapper
 *  - automerge: URLs → resolve to package entry point
 *  - Other URLs → pass through
 */
async function resolveUrl(
  url: string,
  mapper: PackageUrlMapper
): Promise<string> {
  // pkg: URL from iframe → convert back to real path
  const realUrl = mapper.toAutomergeUrl(url);
  if (realUrl) return realUrl;

  // Raw automerge: URL → resolve to entry point
  if (isValidAutomergeUrl(url)) {
    return resolveAutomergeEntryUrl(url as AutomergeUrl);
  }

  return url;
}

export function startModuleRpc(options: ModuleRpcOptions): () => void {
  const { port, mapper } = options;

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (!msg) return;

    if (msg.type === "fetch-module") {
      const { id, url } = msg as { id: number; url: string };
      try {
        const fetchUrl = await resolveUrl(url, mapper);
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
        // Return the resolved URL as a pkg: URL so es-module-shims
        // uses it as the base for relative imports.
        const resolvedUrl = mapper.toPackageUrl(response.url || fetchUrl);
        port.postMessage({
          type: "fetch-module-response",
          id,
          source,
          resolvedUrl,
        });
      } catch (err) {
        port.postMessage({
          type: "fetch-module-error",
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    if (msg.type === "fetch-resource") {
      const { id, url } = msg as { id: number; url: string };
      try {
        const fetchUrl = await resolveUrl(url, mapper);
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          port.postMessage({
            type: "fetch-resource-error",
            id,
            error: `HTTP ${response.status}: ${response.statusText} (${fetchUrl})`,
          });
          return;
        }

        const body = await response.arrayBuffer();
        const contentType =
          response.headers.get("content-type") || "application/octet-stream";
        port.postMessage(
          {
            type: "fetch-resource-response",
            id,
            body,
            contentType,
          },
          [body] // Transfer the ArrayBuffer
        );
      } catch (err) {
        port.postMessage({
          type: "fetch-resource-error",
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }
  };

  port.addEventListener("message", onMessage);
  port.start();

  return () => {
    port.removeEventListener("message", onMessage);
  };
}

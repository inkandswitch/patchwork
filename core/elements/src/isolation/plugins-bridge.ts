/**
 * Plugin registry bridge — collects plugin metadata from the host's
 * registries, maps automerge URLs to opaque package URLs, and handles
 * RPC requests from the iframe for module and resource loading.
 *
 * This module consolidates:
 *  - PluginsUrlMapper: bidirectional mapping between automerge URL segments
 *    and opaque `pkg:` URLs
 *  - getRegistries: walks all host registries and produces
 *    serializable RegistryEntry objects for the iframe
 *  - startPluginsRpc: host-side RPC handler for fetch-package / fetch-resource
 */

import {
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import { getAllRegistries } from "@inkandswitch/patchwork-plugins";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";
import type { RegistryEntry } from "./iframe-bootstrap.js";
import { log } from "./patchwork-isolation.js";

// ---------------------------------------------------------------------------
// PluginsUrlMapper
// ---------------------------------------------------------------------------

/**
 * Maps between automerge document IDs in URLs and opaque package names.
 *
 * Tool code inside the iframe sees `pkg:@patchwork--codemirror-base/dist/index.js`
 * instead of real automerge URLs. This:
 *  - Prevents automerge document IDs from leaking to untrusted code
 *  - Provides a hierarchical URL scheme for relative import resolution
 *  - Makes fetch proxy rules simple: only `pkg:` URLs get proxied
 */
export class PluginsUrlMapper {
  #counter = 0;
  // Raw automerge URL → package name (e.g., "automerge:3Dz..." → "@patchwork--folder")
  #automergeToPackage = new Map<string, string>();
  // Package name → raw automerge URL
  #packageToAutomerge = new Map<string, string>();

  /**
   * Sanitize a package name for use as a URL path segment.
   * "@patchwork/folder" -> "@patchwork--folder"
   */
  #sanitizeName(name: string): string {
    return name.replace(/\//g, "--");
  }

  /**
   * Replace the automerge URL segment in a full URL with a package name.
   * If the segment hasn't been seen before, registers a new mapping.
   * Returns the URL unchanged if no automerge segment is found.
   */
  toPackageUrl(url: string, name?: string): string {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      for (const segment of segments) {
        const decoded = decodeURIComponent(segment);
        // Strip heads suffix (e.g., "automerge:...#headshash") for lookup.
        // isValidAutomergeUrl doesn't recognize URLs with heads appended.
        const hashIdx = decoded.indexOf("#");
        const base = hashIdx >= 0 ? decoded.slice(0, hashIdx) : decoded;
        const heads = hashIdx >= 0 ? decoded.slice(hashIdx + 1) : "";
        if (!isValidAutomergeUrl(base)) continue;

        // Use existing mapping or register a new one
        let pkg = this.#automergeToPackage.get(base);
        if (!pkg) {
          pkg = name
            ? this.#sanitizeName(name)
            : `unknown-${this.#counter++}`;
          this.#automergeToPackage.set(base, pkg);
          this.#packageToAutomerge.set(pkg, base);
        }

        // Preserve heads as a version suffix on the pkg: URL
        const pkgSegment = heads ? `pkg:${pkg}%23${heads}` : `pkg:${pkg}`;
        return url.replace(`/${segment}/`, `/${pkgSegment}/`);
      }
    } catch {
      // not a valid URL, return as-is
    }
    return url;
  }

  /**
   * Replace the package name in a URL with the real automerge URL segment
   * (URL-encoded). Restores heads from the pkg: URL version suffix.
   * Returns null if no package name segment is found.
   */
  toAutomergeUrl(url: string): string | null {
    for (const [pkg, automergeUrl] of this.#packageToAutomerge) {
      // Match pkg:name/ or pkg:name%23heads/
      const pkgPrefix = `pkg:${pkg}`;
      const idx = url.indexOf(pkgPrefix);
      if (idx < 0) continue;

      // Find the end of the pkg segment (next /)
      const afterPkg = idx + pkgPrefix.length;
      const slashIdx = url.indexOf("/", afterPkg);
      if (slashIdx < 0) continue;

      // Extract heads from %23... between pkg name and /
      const suffix = url.slice(afterPkg, slashIdx);
      const heads = suffix.startsWith("%23")
        ? decodeURIComponent(suffix)
        : "";
      const fullAutomerge = heads
        ? `${automergeUrl}${heads}`
        : automergeUrl;

      const pkgSegment = url.slice(idx, slashIdx + 1);
      return url.replace(
        pkgSegment,
        `${encodeURIComponent(fullAutomerge)}/`
      );
    }
    return null;
  }

}

// ---------------------------------------------------------------------------
// Automerge URL filtering
// ---------------------------------------------------------------------------

/**
 * Returns true if any path segment of `url` decodes to a valid automerge URL.
 *
 * Used to reject iframe fetch-proxy requests that smuggle a raw automerge
 * document ID into the host-origin fetch. Legitimate iframe URLs only ever use
 * the opaque `pkg:` scheme (automerge IDs never cross the boundary), so a raw
 * automerge ID in an incoming request can only come from a malicious tool
 * trying to load a document as source/bytes and bypass the sync allowlist.
 *
 * The only legitimate way an automerge-backed URL reaches the real `fetch()`
 * is via the mapper translating a known `pkg:` URL inside `resolveUrl` — those
 * are documents the isolation boundary registered in the `pkg:` registry. By
 * filtering the iframe's *input* (before resolution) and trusting the mapper's
 * output, we serve only registry-known documents.
 *
 * Heads-pinned `pkg:` URLs carry the heads as a `%23<heads>` suffix on the
 * package name (not an automerge ID), so they are unaffected.
 */
export function containsAutomergeUrl(url: string): boolean {
  let segments: string[];
  try {
    segments = new URL(url, window.location.origin).pathname
      .split("/")
      .filter(Boolean);
  } catch {
    // Not URL-parseable; scan the raw string split on "/" so bare
    // `automerge:...` inputs are still caught.
    segments = url.split("/").filter(Boolean);
  }
  for (const segment of segments) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      decoded = segment;
    }
    // Strip any heads suffix (e.g. "automerge:...#heads") before the check.
    const hashIdx = decoded.indexOf("#");
    const base = hashIdx >= 0 ? decoded.slice(0, hashIdx) : decoded;
    if (isValidAutomergeUrl(base)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a plugin's automerge importUrl to its package entry point URL
 * and package name from package.json.
 */
async function resolvePluginEntryUrl(
  importUrl: string
): Promise<{ entryUrl: string; packageName?: string } | undefined> {
  const folderPath = getImportableUrlFromAutomergeUrl(
    importUrl as AutomergeUrl
  );
  const base = new URL(folderPath, window.location.origin);
  const packageJsonUrl = new URL("package.json", base).href;

  const response = await fetch(packageJsonUrl);
  if (!response.ok) return undefined;

  const pkgJson = await response.json();
  const entryPoint = resolvePackageExport(pkgJson);
  if (!entryPoint) return undefined;

  return {
    entryUrl: new URL(entryPoint, base).href,
    packageName: pkgJson.name,
  };
}

/**
 * Resolve a URL for fetching:
 *  - host-origin-prefixed pkg: URLs → strip prefix, then convert via mapper
 *  - bare pkg: URLs → convert to real automerge path via mapper
 *  - automerge: URLs → resolve to package entry point
 *  - Other URLs → pass through
 *
 * Chunk URLs from code-split packages arrive as host-origin-prefixed pkg: URLs
 * (e.g., `https://host/pkg:@scope--name/dist/assets/chunk.js`) because the
 * resolved module URL returned to es-module-shims is host-origin-prefixed to
 * enable relative URL resolution against pkg: paths.
 */
async function resolveUrl(
  url: string,
  mapper: PluginsUrlMapper
): Promise<string> {
  // Strip host origin prefix if present — chunk URLs arrive this way
  // because resolved module URLs are prefixed for relative URL resolution.
  const origin = window.location.origin;
  let lookupUrl = url;
  if (url.startsWith(origin + "/pkg:")) {
    lookupUrl = url.slice(origin.length + 1);
  }

  const realUrl = mapper.toAutomergeUrl(lookupUrl);
  if (realUrl) return realUrl;

  if (isValidAutomergeUrl(lookupUrl)) {
    const resolved = await resolvePluginEntryUrl(lookupUrl);
    if (resolved) return resolved.entryUrl;
    throw new Error(`Failed to resolve automerge URL: ${lookupUrl}`);
  }

  return url;
}

// ---------------------------------------------------------------------------
// Registry entry collection
// ---------------------------------------------------------------------------

/**
 * Collect registry entries from all plugin registries, converting automerge
 * importUrls to pkg: URLs via the mapper so that automerge document IDs
 * don't leak to the iframe.
 */
export async function getRegistries(
  mapper: PluginsUrlMapper
): Promise<RegistryEntry[]> {
  const entries: RegistryEntry[] = [];

  for (const [, registry] of getAllRegistries()) {
    for (const plugin of registry.all()) {
      let importUrl = (plugin as any).importUrl as string | undefined;

      if (importUrl) {
        const resolved = await resolvePluginEntryUrl(importUrl);
        if (resolved) {
          importUrl = mapper.toPackageUrl(
            resolved.entryUrl,
            resolved.packageName ?? (plugin as any).id
          );
        } else {
          importUrl = undefined;
        }
      }

      // Strip non-cloneable properties (functions, loaded implementations)
      // and deep-copy everything else so it can be sent via postMessage.
      const { load, module, ...rest } = plugin as any;
      let entry: RegistryEntry;
      try {
        entry = structuredClone(rest);
      } catch (err) {
        log(`skipping non-cloneable plugin: ${rest.id}`, err);
        continue;
      }
      entry.importUrl = importUrl;
      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Watch all host registries for new plugin registrations and push updates
 * to the iframe via the RPC port. Also updates the mapper with new package
 * URL mappings.
 *
 * Returns a cleanup function that unsubscribes from all registries.
 */
export function watchRegistries(
  port: MessagePort,
  mapper: PluginsUrlMapper
): () => void {
  const unsubs: Array<() => void> = [];

  for (const [, registry] of getAllRegistries()) {
    const unsub = registry.on("registered", async (plugin: any) => {
      let importUrl = plugin.importUrl as string | undefined;

      if (importUrl) {
        const resolved = await resolvePluginEntryUrl(importUrl);
        if (resolved) {
          importUrl = mapper.toPackageUrl(
            resolved.entryUrl,
            resolved.packageName ?? plugin.id
          );
        } else {
          importUrl = undefined;
        }
      }

      const { load, module, ...rest } = plugin;
      let entry: RegistryEntry;
      try {
        entry = structuredClone(rest);
      } catch (err) {
        log(`skipping non-cloneable plugin update: ${rest.id}`, err);
        return;
      }
      entry.importUrl = importUrl;

      log(`pushing registry update: ${entry.id}`);
      port.postMessage({ type: "plugin-registered", entry });
    });
    unsubs.push(unsub);
  }

  return () => {
    for (const unsub of unsubs) unsub();
  };
}

// ---------------------------------------------------------------------------
// Plugins RPC — host-side handler for iframe module/resource loading
// ---------------------------------------------------------------------------

export interface PluginsRpcOptions {
  port: MessagePort;
  mapper: PluginsUrlMapper;
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
 * Start the host-side RPC handler for plugins and resource loading.
 *
 * Handles two message types:
 *  - `fetch-package`: returns source text + resolved URL (for es-module-shims)
 *  - `fetch-resource`: returns ArrayBuffer + content type (for fetch proxy)
 */
export function startPluginsRpc(options: PluginsRpcOptions): () => void {
  const { port, mapper } = options;

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (!msg) return;

    if (msg.type === "fetch-package") {
      const { id, url } = msg as { id: number; url: string };
      if (rejectIfAutomerge(port, id, url, "fetch-package-error")) return;
      try {
        const fetchUrl = await resolveUrl(url, mapper);

        if (fetchUrl !== url) {
          log(`fetch-package ${url} → ${fetchUrl}`);
        } else {
          log(`fetch-package ${url}`);
        }
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          const error = `HTTP ${response.status}: ${response.statusText} (${fetchUrl})`;
          log(`fetch-package error ${url}: ${error}`);
          port.postMessage({ type: "fetch-package-error", id, error });
          return;
        }

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
        port.postMessage({
          type: "fetch-package-response",
          id,
          source,
          resolvedUrl,
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        log(`fetch-package error ${url}: ${error}`);
        port.postMessage({ type: "fetch-package-error", id, error });
      }
      return;
    }

    if (msg.type === "fetch-resource") {
      const { id, url } = msg as { id: number; url: string };
      if (rejectIfAutomerge(port, id, url, "fetch-resource-error")) return;
      try {
        const fetchUrl = await resolveUrl(url, mapper);
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          const error = `HTTP ${response.status}: ${response.statusText} (${fetchUrl})`;
          log(`fetch-resource error ${url}: ${error}`);
          port.postMessage({ type: "fetch-resource-error", id, error });
          return;
        }

        const body = await response.arrayBuffer();
        const contentType =
          response.headers.get("content-type") || "application/octet-stream";
        log(`fetch-resource ${url} → ${fetchUrl} (${contentType})`);
        port.postMessage(
          {
            type: "fetch-resource-response",
            id,
            body,
            contentType,
          },
          [body]
        );
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        log(`fetch-resource error ${url}: ${error}`);
        port.postMessage({ type: "fetch-resource-error", id, error });
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

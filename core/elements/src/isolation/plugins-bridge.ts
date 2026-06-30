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
import type { RegistryEntry } from "./types.js";
import { log } from "./patchwork-isolation.js";

// ---------------------------------------------------------------------------
// Automerge URL segment scanning (shared helpers)
// ---------------------------------------------------------------------------

/**
 * Split a path segment into its automerge base and trailing heads (version)
 * suffix. Automerge URLs may be pinned to specific heads as
 * `automerge:<id>#<heads>`; `isValidAutomergeUrl` only recognizes the base, so
 * callers strip the heads before validating and restore them afterwards.
 */
function stripHeads(segment: string): { base: string; heads: string } {
  const hashIdx = segment.indexOf("#");
  return hashIdx >= 0
    ? { base: segment.slice(0, hashIdx), heads: segment.slice(hashIdx + 1) }
    : { base: segment, heads: "" };
}

/**
 * Scan a URL's path for segments that decode to a valid automerge URL.
 * Returns one entry per matching segment, preserving the raw segment (for
 * string replacement) alongside its decoded base/heads. Used by both the
 * pkg:-URL mapper and the fetch-proxy automerge filter so the two share one
 * notion of "where the automerge IDs are in a URL".
 *
 * Falls back to a raw "/"-split when the input isn't URL-parseable, so bare
 * `automerge:...` strings are still scanned.
 */
function findAutomergeSegments(
  url: string
): Array<{ segment: string; base: string; heads: string }> {
  let segments: string[];
  try {
    segments = new URL(url, window.location.origin).pathname
      .split("/")
      .filter(Boolean);
  } catch {
    segments = url.split("/").filter(Boolean);
  }

  const matches: Array<{ segment: string; base: string; heads: string }> = [];
  for (const segment of segments) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      decoded = segment;
    }
    const { base, heads } = stripHeads(decoded);
    if (isValidAutomergeUrl(base)) matches.push({ segment, base, heads });
  }
  return matches;
}

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
    // Replace the first automerge segment found; leave non-automerge URLs as-is.
    const [match] = findAutomergeSegments(url);
    if (!match) return url;
    const { segment, base, heads } = match;

    // Use the existing mapping for this automerge ID, or register a new one.
    let pkg = this.#automergeToPackage.get(base);
    if (!pkg) {
      pkg = name ? this.#sanitizeName(name) : `unknown-${this.#counter++}`;
      this.#automergeToPackage.set(base, pkg);
      this.#packageToAutomerge.set(pkg, base);
    }

    // Preserve any heads as a version suffix on the pkg: URL.
    const pkgSegment = heads ? `pkg:${pkg}%23${heads}` : `pkg:${pkg}`;
    return url.replace(`/${segment}/`, `/${pkgSegment}/`);
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
  return findAutomergeSegments(url).length > 0;
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a plugin's importUrl to its package entry point URL and package name.
 *
 * Plugin source can be stored in two places, and the importUrl says which:
 *  - **Automerge URL** (`automerge:...`) — the package lives in a folder doc in
 *    the host repo. We resolve it the same way the host does: read the folder's
 *    `package.json` (via the service-worker-resolvable host-origin path) and
 *    resolve its export to the entry point. These get rewritten to opaque `pkg:`
 *    URLs by the caller so the automerge ID never reaches the iframe.
 *  - **Plain HTTP(S) URL** — the package is statically deployed elsewhere (e.g.
 *    a Netlify bundle listed in a static module manifest). The importUrl is
 *    already the resolved entry point (mirroring how `ModuleWatcher` does a
 *    bare `import(importName)` for non-automerge modules), so we pass it through
 *    unchanged. It carries no user data and is loaded directly, not via the
 *    host-origin/automerge path — routing it through the service worker is what
 *    produced the 35s "no reply from the automerge worker" hangs.
 */
async function resolvePluginEntryUrl(
  importUrl: string
): Promise<{ entryUrl: string; packageName?: string } | undefined> {
  // Non-automerge importUrls are already-resolved entry points hosted wherever
  // they live; pass them through without the folder/package.json resolution.
  if (!isValidAutomergeUrl(importUrl)) {
    return { entryUrl: importUrl };
  }

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
 * Convert a host registry plugin into a serializable `RegistryEntry` for the
 * iframe:
 *  - resolve its `importUrl` to a package entry point. For an automerge
 *    `importUrl` the mapper rewrites the entry to an opaque `pkg:` URL so the
 *    automerge ID never leaks; for a plain HTTP(S) `importUrl` the entry passes
 *    through unchanged (`toPackageUrl` only rewrites automerge segments), so the
 *    iframe imports it directly from where it is deployed;
 *  - strip non-cloneable fields (`load`, `module`) and deep-copy the rest so it
 *    survives `postMessage`.
 *
 * Returns `undefined` (and logs) if the plugin can't be cloned. Shared by the
 * initial collection (`getRegistries`) and the live update watcher
 * (`watchRegistries`) so both produce entries identically.
 */
async function processRegistryPlugin(
  plugin: any,
  mapper: PluginsUrlMapper
): Promise<RegistryEntry | undefined> {
  let importUrl = plugin.importUrl as string | undefined;
  if (importUrl) {
    const resolved = await resolvePluginEntryUrl(importUrl);
    importUrl = resolved
      ? mapper.toPackageUrl(resolved.entryUrl, resolved.packageName ?? plugin.id)
      : undefined;
  }

  const { load, module, ...rest } = plugin;
  let entry: RegistryEntry;
  try {
    entry = structuredClone(rest);
  } catch (err) {
    log(`skipping non-cloneable plugin: ${rest.id}`, err);
    return undefined;
  }
  entry.importUrl = importUrl;
  return entry;
}

/**
 * Collect registry entries from all plugin registries (with importUrls
 * rewritten to pkg: URLs) for the iframe's initial registry population.
 */
export async function getRegistries(
  mapper: PluginsUrlMapper
): Promise<RegistryEntry[]> {
  const entries: RegistryEntry[] = [];
  for (const [, registry] of getAllRegistries()) {
    for (const plugin of registry.all()) {
      const entry = await processRegistryPlugin(plugin, mapper);
      if (entry) entries.push(entry);
    }
  }
  return entries;
}

/**
 * Watch all host registries for new plugin registrations and push each (as a
 * mapped, serializable entry) to the iframe via the RPC port.
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
      const entry = await processRegistryPlugin(plugin, mapper);
      if (!entry) return;
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
  mapper: PluginsUrlMapper,
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

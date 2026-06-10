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
        if (!isValidAutomergeUrl(decoded)) continue;

        // Use existing mapping if we've seen this automerge URL before
        const existing = this.#automergeToPackage.get(decoded);
        if (existing) {
          return url.replace(`/${segment}/`, `/pkg:${existing}/`);
        }

        // Register a new mapping
        const pkg = name
          ? this.#sanitizeName(name)
          : `unknown-${this.#counter++}`;
        this.#automergeToPackage.set(decoded, pkg);
        this.#packageToAutomerge.set(pkg, decoded);
        return url.replace(`/${segment}/`, `/pkg:${pkg}/`);
      }
    } catch {
      // not a valid URL, return as-is
    }
    return url;
  }

  /**
   * Replace the package name in a URL with the real automerge URL segment
   * (URL-encoded). Returns null if no package name segment is found.
   */
  toAutomergeUrl(url: string): string | null {
    for (const [pkg, automergeUrl] of this.#packageToAutomerge) {
      const packageSegment = `pkg:${pkg}/`;
      if (url.includes(packageSegment)) {
        return url.replace(
          packageSegment,
          `${encodeURIComponent(automergeUrl)}/`
        );
      }
    }
    return null;
  }

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
 *  - pkg: URLs → convert to real automerge path via mapper
 *  - automerge: URLs → resolve to package entry point
 *  - Other URLs → pass through
 */
async function resolveUrl(
  url: string,
  mapper: PluginsUrlMapper
): Promise<string> {
  const realUrl = mapper.toAutomergeUrl(url);
  if (realUrl) return realUrl;

  if (isValidAutomergeUrl(url)) {
    const resolved = await resolvePluginEntryUrl(url);
    if (resolved) return resolved.entryUrl;
    throw new Error(`Failed to resolve automerge URL: ${url}`);
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

// ---------------------------------------------------------------------------
// Plugins RPC — host-side handler for iframe module/resource loading
// ---------------------------------------------------------------------------

export interface PluginsRpcOptions {
  port: MessagePort;
  mapper: PluginsUrlMapper;
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
        const resolvedUrl = mapper.toPackageUrl(response.url || fetchUrl);
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

/**
 * Resource policy interface for controlling which URLs a tool can
 * fetch/load through the capnweb RPC channel.
 */

import { isValidAutomergeUrl } from "@automerge/automerge-repo";

/** Policy that gates HostApi.loadModuleSource() and HostApi.fetchResource(). */
export interface ResourcePolicy {
  /** Can this tool fetch/load this URL? */
  canFetch(url: string): boolean;
}

/** Allows all requests. Intentionally unsafe — use only for debugging. */
export class AllowAllPolicy implements ResourcePolicy {
  canFetch(): boolean {
    return true;
  }
}

/**
 * Default restrictive policy that:
 *  - Allows same-origin URLs that do NOT contain automerge document IDs
 *  - Allows importmap URLs (which are already same-origin after resolution)
 *  - Blocks all cross-origin URLs (prevents exfiltration)
 *  - Blocks URLs containing encoded automerge document IDs in path segments
 *    (prevents reading documents outside the repo channel)
 *
 * Opaque `__plugin__/` URLs are resolved by the OpaqueUrlMapper *before*
 * the policy check, so they never reach this code — their real (automerge)
 * URLs are fetched directly. This policy only gates non-opaque URLs.
 */
export class RestrictivePolicy implements ResourcePolicy {
  #hostOrigin: string;
  #importMapUrls: Set<string>;

  constructor(hostOrigin: string, importMapUrls: Set<string>) {
    this.#hostOrigin = hostOrigin;
    this.#importMapUrls = importMapUrls;
  }

  canFetch(url: string): boolean {
    // Importmap URLs are always allowed — they are the known set of
    // framework/library modules the host resolved at init time.
    if (this.#importMapUrls.has(url)) return true;

    // Parse the URL, resolving relative paths against the host origin.
    let parsed: URL;
    try {
      parsed = new URL(url, this.#hostOrigin);
    } catch {
      return false;
    }

    // Block cross-origin requests — prevents exfiltration to external servers.
    if (parsed.origin !== this.#hostOrigin) return false;

    // Block URLs whose path contains an encoded automerge document ID.
    // These look like `/%automerge%3A...` or `/automerge:...` in a path
    // segment. Without this check, a tool could use fetchResource to read
    // arbitrary documents via the host's service worker URL resolution.
    const segments = parsed.pathname.split("/");
    for (const segment of segments) {
      const decoded = decodeURIComponent(segment);
      if (isValidAutomergeUrl(decoded)) return false;
    }

    return true;
  }
}

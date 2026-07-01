/**
 * URL translation, resolution, and filtering for the isolation boundary — the
 * naming/addressing layer that both the resource bridge and the registry bridge
 * build on.
 *
 *  - `PackagesUrlMapper`: bidirectional mapping between automerge URL segments
 *    and opaque `pkg:` URLs, so real document IDs never reach the iframe.
 *  - `resolvePackageEntryUrl` / `resolveUrl`: turn an importUrl (or an incoming
 *    iframe request) into a concrete fetchable URL.
 *  - `containsAutomergeUrl`: the security filter that rejects raw automerge IDs
 *    smuggled into fetch-proxy requests.
 */

import {
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";

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
// PackagesUrlMapper
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
export class PackagesUrlMapper {
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
export async function resolvePackageEntryUrl(
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
export async function resolveUrl(
  url: string,
  mapper: PackagesUrlMapper
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
    const resolved = await resolvePackageEntryUrl(lookupUrl);
    if (resolved) return resolved.entryUrl;
    throw new Error(`Failed to resolve automerge URL: ${lookupUrl}`);
  }

  return url;
}

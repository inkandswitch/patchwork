/**
 * Shared types for the isolation boundary.
 *
 * These describe the data that crosses between the trusted host and the
 * untrusted iframe (via postMessage), so they must stay in exact agreement on
 * both sides. They live here — rather than in either the host element or the
 * iframe bootstrap — so there is a single source of truth and the two ends
 * cannot drift apart.
 */

import type { AutomergeUrl } from "@automerge/automerge-repo";

/**
 * The boot spec the host hands to `<patchwork-isolation>` via `configure()`.
 *
 * It is data only — no live DOM, no functions, no handles. The host computes it
 * from its own state; the iframe imports the module at `entryUrl` and calls its
 * default export as the mount fn, and the element seeds the document allowlist
 * from `rootUrls`. Any change to the spec tears the iframe down and boots a fresh
 * one (no diffing).
 */
export interface IsolationBootSpec {
  /**
   * URL of the root module to mount. The host resolves it to an opaque `pkg:`
   * URL (the same pipeline plugin import URLs go through) before sending it to
   * the iframe, which imports it and calls its **default export** as the mount
   * fn `(element, repo) => cleanup`. No registry entry is involved.
   *
   * A tool typically produces this with
   * `new URL(/* @vite-ignore *\/ "./entry.js", import.meta.url).href`.
   */
  entryUrl: string;
  /**
   * Props handed to the root. Structured-clone JSON only — no `Accessor`,
   * callback, DOM node, or handle. Materialized inside the iframe as an inert
   * `<script type="application/json">` child the root reads on mount.
   */
  props: Record<string, unknown>;
  /** Documents to seed the sync allowlist with, computed from host state. */
  rootUrls: AutomergeUrl[];
}

/**
 * A plugin registry entry, stripped of non-cloneable fields (functions, loaded
 * implementations) so it can be sent to the iframe via postMessage. `importUrl`
 * has been rewritten to an opaque `pkg:` URL before transfer (see
 * PluginsUrlMapper). The index signature carries through any other
 * serializable plugin metadata.
 */
export interface RegistryEntry {
  type: string;
  id: string;
  name: string;
  importUrl?: string;
  [key: string]: unknown;
}

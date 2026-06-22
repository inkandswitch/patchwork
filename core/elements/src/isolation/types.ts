/**
 * Shared types for the isolation boundary.
 *
 * These describe the data that crosses between the trusted host and the
 * untrusted iframe (via postMessage), so they must stay in exact agreement on
 * both sides. They live here — rather than in either the host element or the
 * iframe bootstrap — so there is a single source of truth and the two ends
 * cannot drift apart.
 */

/**
 * A serialized DOM element: tag name, attributes, and children. The host
 * serializes its isolated subtree into this shape; the iframe reconstructs the
 * same tree from it.
 */
export interface SerializedView {
  tagName: string;
  attributes: Record<string, string>;
  children: SerializedView[];
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

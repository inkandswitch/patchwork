/**
 * RPC contract types for communication between the host page and the isolated
 * tool iframe, using capnweb's object-capability RPC over MessagePort.
 *
 * These types describe the shape of the RPC targets on each side. The host
 * imports capnweb normally; the iframe receives capnweb source at runtime.
 */

// ---------------------------------------------------------------------------
// Plugin registry capability types
// ---------------------------------------------------------------------------

/**
 * Plugin metadata exposed to the iframe. Has the same shape as a plugin
 * description from the host registry, but the `importUrl` field contains an
 * opaque `/__plugin__/` URL instead of an automerge URL. This means existing
 * tool code that reads `plugin.importUrl` continues to work — it just sees a
 * safe opaque URL that cannot be used to discover or modify tool source code.
 *
 * The type is intentionally a plain object (not generic) so it can be
 * serialized over capnweb RPC without class identity.
 */
export interface PluginMetadata {
  id: string;
  type: string;
  name: string;
  icon?: string;
  importUrl: string;
  unlisted?: boolean;
  // Tool-specific fields (present when type is "patchwork:tool"):
  supportedDatatypes?: string[] | "*";
  tags?: string[];
  forTitleBar?: boolean;
}

/**
 * Capability for querying the host's plugin registry. The host returns this
 * as a capnweb RpcTarget — the iframe receives a stub whose method calls are
 * proxied back to the host.
 *
 * All `importUrl` values in returned metadata use the opaque `/__plugin__/`
 * scheme. The iframe loads modules via `importShim(meta.importUrl)` which
 * triggers `loadModuleSource` on the host RPC, where the opaque URL is
 * mapped back to the real automerge-backed path.
 */
export interface PluginRegistryCapability {
  /**
   * List all known registry type keys (e.g., "patchwork:tool", "patchwork:datatype").
   * Used at boot to discover all plugin types and pre-populate the iframe's
   * local registries.
   */
  listRegistryTypes(): Promise<string[]>;

  /**
   * List all plugins of a given type.
   * e.g., list("patchwork:tool") → all tool descriptions
   * e.g., list("patchwork:datatype") → all datatype descriptions
   */
  list(pluginType: string): Promise<PluginMetadata[]>;

  /**
   * Get a single plugin by ID. Returns null if not found.
   */
  get(pluginId: string): Promise<PluginMetadata | null>;
}

// ---------------------------------------------------------------------------
// Host ↔ iframe RPC contracts
// ---------------------------------------------------------------------------

/** Host exposes these methods to the iframe via capnweb RPC. */
export interface HostRpcContract {
  /**
   * Get a capability for querying the host's plugin registry.
   * Returns a capnweb RpcTarget stub — the iframe can call methods on it.
   */
  getPluginRegistry(): PluginRegistryCapability;

  /** Fetch module source text for es-module-shims to evaluate. */
  loadModuleSource(url: string): Promise<string>;
  /**
   * Fetch a resource on behalf of the iframe (the sandboxed iframe cannot make
   * network requests itself). Returns content-type and body.
   */
  fetchResource(
    url: string
  ): Promise<{ contentType: string; body: string | Uint8Array }>;
  /** Iframe reports successful tool mount. */
  onMounted(url: string, toolId: string): void;
  /** Iframe wants the host to navigate to a different document. */
  onOpenDocument(
    url: string,
    toolId?: string,
    title?: string,
    docType?: string
  ): void;
}

/**
 * Iframe exposes these methods to the host via capnweb RPC.
 * Currently empty — placeholder for future host→iframe calls
 * (e.g., navigate, focus, theme changes).
 */
export interface IframeRpcContract {}

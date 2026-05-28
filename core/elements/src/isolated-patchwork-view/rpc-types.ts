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
 * description from the host registry, but the `importUrl` field contains a
 * `/pkg:` URL (using the package name) instead of an automerge URL.
 * This means existing tool code that reads `plugin.importUrl` continues to
 * work — it just sees a package-name URL that cannot be used to discover or
 * modify tool source code.
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
 * All `importUrl` values in returned metadata use the `/pkg:` scheme
 * with package names instead of automerge document IDs. The iframe loads
 * modules via `importShim(meta.importUrl)` which triggers `loadModuleSource`
 * on the host RPC, where the package URL is mapped back to the real
 * automerge-backed path.
 */
export interface PluginRegistryCapability {
  /**
   * List all known registry type keys (e.g., "patchwork:tool",
   * "patchwork:datatype", "codemirror:extension").
   */
  listRegistryTypes(): Promise<string[]>;

  /**
   * List all plugins of a given type.
   * Mirrors getRegistry(type).all() with package-name importUrls.
   */
  list(pluginType: string): Promise<PluginMetadata[]>;

  /**
   * Get a single plugin by ID. Returns null if not found.
   * Mirrors getRegistry(type).get(id) with package-name importUrl.
   */
  get(pluginId: string): Promise<PluginMetadata | null>;

  /**
   * Get all tools that support a given datatype.
   * Mirrors getSupportedToolsForType(type) from tools.ts.
   */
  getSupportedToolsForType(type: string): Promise<PluginMetadata[]>;

  /**
   * Get the default tool for a document based on its `@patchwork.type`.
   * Mirrors getFallbackTool(doc) — takes docUrl since doc can't cross RPC.
   */
  getFallbackTool(docUrl: string): Promise<PluginMetadata | null>;

  /**
   * Get all tools that support a document's datatype.
   * Mirrors getSupportedTools(doc) — takes docUrl since doc can't cross RPC.
   */
  getSupportedTools(docUrl: string): Promise<PluginMetadata[]>;
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
  /** Iframe wants the host to navigate to a different document.
   * If the document is not on the sync allowlist, the user will be prompted. */
  onOpenDocument(
    url: string,
    toolId?: string,
    title?: string,
    docType?: string
  ): Promise<void>;
  /**
   * Request access to a document not currently on the sync allowlist.
   * The host will prompt the user and return whether access was granted.
   * If already allowlisted, returns true immediately.
   */
  requestDocumentAccess(url: string): Promise<boolean>;
}

/**
 * Iframe exposes these methods to the host via capnweb RPC.
 * The host calls these methods to push updates to the iframe.
 */
export interface IframeRpcContract {
  /** Host pushes a plugin registration update to the iframe. */
  onPluginRegistered(meta: PluginMetadata): void;
}

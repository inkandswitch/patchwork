/**
 * RPC contract types for communication between the host page and the isolated
 * tool iframe, using capnweb's object-capability RPC over MessagePort.
 *
 * These types describe the shape of the RPC targets on each side. The host
 * imports capnweb normally; the iframe receives capnweb source at runtime.
 */

/** Host exposes these methods to the iframe via capnweb RPC. */
export interface HostRpcContract {
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

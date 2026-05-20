/**
 * RPC interfaces for communication between the host page and isolated tool
 * iframes, using capnweb's object-capability RPC over MessagePort.
 */

import { newMessagePortRpcSession, RpcTarget } from "capnweb";

/**
 * Exposed by the host to the isolated iframe.
 * The iframe calls these methods via its RPC stub.
 */
export class HostApi extends RpcTarget {
  #onRequestDocument: (docUrl: string, reason: string) => Promise<boolean>;
  #onOpenDocument: (
    url: string,
    toolId?: string,
    title?: string,
    type?: string
  ) => void;
  #onMounted: (url: string, toolId: string) => void;

  constructor(
    onRequestDocument: (docUrl: string, reason: string) => Promise<boolean>,
    onOpenDocument: (
      url: string,
      toolId?: string,
      title?: string,
      type?: string
    ) => void,
    onMounted: (url: string, toolId: string) => void
  ) {
    super();
    this.#onRequestDocument = onRequestDocument;
    this.#onOpenDocument = onOpenDocument;
    this.#onMounted = onMounted;
  }

  /** Iframe requests access to a document not in the initial allowed set. */
  requestDocument(docUrl: string, reason: string): Promise<boolean> {
    return this.#onRequestDocument(docUrl, reason);
  }

  /** Iframe wants to navigate the parent frame to a different document. */
  openDocument(
    url: string,
    toolId?: string,
    title?: string,
    type?: string
  ): void {
    this.#onOpenDocument(url, toolId, title, type);
  }

  /** Iframe reports successful tool mount. */
  mounted(url: string, toolId: string): void {
    this.#onMounted(url, toolId);
  }
}

/**
 * Exposed by the isolated iframe to the host.
 * The host calls these methods via its RPC stub.
 */
export class IframeApi extends RpcTarget {
  #onNavigate: (docUrl: string, toolId: string) => void;

  constructor(onNavigate: (docUrl: string, toolId: string) => void) {
    super();
    this.#onNavigate = onNavigate;
  }

  /** Host tells the iframe to render a different doc/tool. */
  navigate(docUrl: string, toolId: string): void {
    this.#onNavigate(docUrl, toolId);
  }
}

export const setupRpc = (port: MessagePort, callbacks: any) => {
  const hostApi = new HostApi(
    callbacks.onRequestDocument,
    callbacks.onOpenDocument,
    callbacks.onMounted
  );
  const stub = newMessagePortRpcSession<IframeApi>(port, hostApi);
  return {
    navigate(docUrl: string, toolId: string) {
      stub.navigate(docUrl, toolId);
    },
  };
};

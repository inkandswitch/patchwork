/**
 * Navigation bridge — forwards `patchwork:open-document` events from the
 * iframe to the host element so that tools can trigger navigation.
 *
 * Protocol:
 *   iframe → host:  { type: "open-document", detail: OpenDocumentEventDetail }
 */

import type { OpenDocumentEventDetail } from "../events.js";

/**
 * Host-side navigation bridge.
 *
 * Listens on the RPC port for `open-document` messages from the iframe
 * and re-dispatches them as `patchwork:open-document` CustomEvents on
 * the host element.
 */
export function startHostNavigationBridge(
  rpcPort: MessagePort,
  hostElement: HTMLElement
): () => void {
  const onMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (msg?.type !== "open-document") return;

    const detail = msg.detail as OpenDocumentEventDetail;

    hostElement.dispatchEvent(
      new CustomEvent("patchwork:open-document", {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  };

  rpcPort.addEventListener("message", onMessage);

  return () => {
    rpcPort.removeEventListener("message", onMessage);
  };
}

/**
 * Returns the iframe-side bootstrap code for the navigation bridge as a
 * string to be inlined in the iframe's srcdoc.
 *
 * This code intercepts `patchwork:open-document` events at the document
 * level and forwards them to the host via the RPC port.
 */
export function getIframeNavigationBridgeCode(): string {
  return `
    // Navigation bridge: forward patchwork:open-document events to host
    document.addEventListener("patchwork:open-document", (event) => {
      event.stopPropagation();
      __rpcPort.postMessage({
        type: "open-document",
        detail: event.detail,
      });
    }, true);
  `;
}

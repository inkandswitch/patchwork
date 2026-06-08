/**
 * Provider bridge — forwards `patchwork:subscribe` events across the iframe
 * boundary so that tools inside the iframe can subscribe to host-side
 * providers (comments, focus, selected-doc, account).
 *
 * ## How it works
 *
 * **Iframe side** (runs inside the iframe):
 *   Intercepts `patchwork:subscribe` CustomEvents at the document level.
 *   Transfers the MessagePort from the event detail to the host via the
 *   RPC channel. The selector (JSON-serializable) is sent alongside.
 *
 * **Host side** (runs on the host):
 *   Receives the transferred port and selector, creates a synthetic
 *   `patchwork:subscribe` CustomEvent with the transferred port as
 *   `detail.port`, and dispatches it on the host element. The event
 *   bubbles up to host-side providers which call `accept()` normally.
 *
 * Because MessagePorts are transferable, the provider's response channel
 * connects directly to the iframe consumer — the bridge is not in the
 * data path after the initial connection.
 *
 * Protocol:
 *   iframe → host:  { type: "provider-subscribe", selector: Selector }
 *                   with transferred [MessagePort]
 */

import type { Selector, SubscribeEventDetail } from "@inkandswitch/patchwork-providers";

/**
 * Host-side provider bridge.
 *
 * Listens on the RPC port for `provider-subscribe` messages from the
 * iframe. For each one, creates a `patchwork:subscribe` event with the
 * transferred port and dispatches it on the host element.
 */
export function startHostProviderBridge(
  rpcPort: MessagePort,
  hostElement: HTMLElement
): () => void {
  const onMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (msg?.type !== "provider-subscribe") return;

    const selector = msg.selector as Selector;

    // The MessagePort is transferred as the first item in event.ports
    const port = event.ports?.[0];
    if (!port) {
      console.warn(
        "[isolation] provider-subscribe without transferred port",
        selector
      );
      return;
    }

    const detail: SubscribeEventDetail = { selector, port };

    hostElement.dispatchEvent(
      new CustomEvent<SubscribeEventDetail>("patchwork:subscribe", {
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
 * Returns the iframe-side bootstrap code for the provider bridge as a
 * string to be inlined in the iframe's srcdoc.
 *
 * This code intercepts `patchwork:subscribe` events at the document level
 * and forwards them to the host via the RPC port.
 */
export function getIframeProviderBridgeCode(): string {
  return `
    // Provider bridge: forward patchwork:subscribe events to host
    document.addEventListener("patchwork:subscribe", (event) => {
      const { selector, port } = event.detail;
      event.stopPropagation();

      // Transfer the MessagePort to the host
      __rpcPort.postMessage(
        { type: "provider-subscribe", selector },
        [port]
      );
    }, true);
  `;
}

/**
 * The iframe side of the providers bridge (the host side is
 * bridges/providers-bridge.ts). Runs inside the sandbox: defined at module scope
 * so tsc checks it, serialized into the srcdoc by ../host/srcdoc.ts, and called
 * from `boot()`.
 *
 * Provider subscriptions (`patchwork:subscribe` events) that no in-iframe
 * provider claims are forwarded to the host over the RPC port, and the host's
 * pushed values are relayed back to the subscribing consumer. `createProvidersBridge`
 * owns the subscription bookkeeping; `boot()` owns the RPC port and calls
 * `handle()` for the inbound `providers-bridge-*` messages.
 */

import type { IframeLog } from "./types.js";

export interface ProvidersBridge {
  /**
   * Register the document-level `patchwork:subscribe` listener that forwards
   * unclaimed subscriptions to the host. Call once, after the RPC port is live.
   */
  install(): void;
  /**
   * Handle an inbound RPC message. Returns true if it was a `providers-bridge-*`
   * message (and was consumed), false otherwise.
   */
  handle(event: MessageEvent): boolean;
}

/**
 * Create the iframe's providers bridge over `rpcPort` (owned by the caller).
 */
export function createProvidersBridge(
  rpcPort: MessagePort,
  log: IframeLog
): ProvidersBridge {
  // Consumer ports for subscriptions currently forwarded to the host, keyed by
  // the id we assigned when forwarding.
  const bridgedSubscriptions = new Map<number, MessagePort>();
  let bridgeId = 0;

  function handle(event: MessageEvent): boolean {
    const msg = event.data;
    if (!msg) return false;

    if (msg.type === "providers-bridge-change") {
      // Host provider pushed a value — relay to the consumer's port.
      log("providers-bridge: received change for id:", msg.id, "value:", msg.value);
      const port = bridgedSubscriptions.get(msg.id);
      if (port) {
        port.postMessage({ type: "change", value: msg.value });
      }
      return true;
    }
    if (msg.type === "providers-bridge-rejected") {
      // Host rejected this subscription type — clean up.
      log("providers-bridge: rejected by host for id:", msg.id);
      bridgedSubscriptions.delete(msg.id);
      return true;
    }

    return false;
  }

  function install(): void {
    // Forward unclaimed patchwork:subscribe events to the host so host-side
    // providers (e.g. AccountProvider for patchwork:contact) can answer them.
    // Local providers call stopPropagation(), so only unclaimed subscriptions
    // reach document.
    document.addEventListener("patchwork:subscribe", ((event: CustomEvent) => {
      const detail = event.detail;
      if (!detail?.selector?.type || !detail?.port) return;

      log("providers-bridge: captured unclaimed subscription:", detail.selector.type, detail.selector);

      event.stopPropagation();
      const id = ++bridgeId;
      const consumerPort = detail.port as MessagePort;
      bridgedSubscriptions.set(id, consumerPort);

      // Forward to host
      rpcPort.postMessage({
        type: "providers-bridge",
        id,
        selector: detail.selector,
      });

      // Listen for consumer unsubscribe
      consumerPort.addEventListener("message", (e: MessageEvent) => {
        if (e.data?.type === "unsubscribe") {
          log("providers-bridge: consumer unsubscribed:", detail.selector.type, id);
          rpcPort.postMessage({ type: "providers-bridge-unsubscribe", id });
          bridgedSubscriptions.delete(id);
          consumerPort.close();
        }
      });
      consumerPort.start();
    }) as EventListener);
  }

  return { install, handle };
}

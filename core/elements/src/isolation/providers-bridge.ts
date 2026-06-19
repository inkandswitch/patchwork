/**
 * Providers bridge — relays provider subscriptions from the iframe to
 * host-side providers across the isolation boundary.
 *
 * The iframe forwards ALL unclaimed `patchwork:subscribe` events to the
 * host via RPC. The host checks the subscription type against an allowlist
 * and either answers it (by dispatching a real `patchwork:subscribe` on
 * the host element) or rejects it.
 *
 * This bridge exists because DOM events don't cross iframe boundaries.
 * Provider subscriptions use `patchwork:subscribe` CustomEvents that bubble
 * up the DOM tree — inside the iframe, they can only reach local providers.
 * Subscriptions that no local provider answers (e.g. `patchwork:contact`)
 * are forwarded here so host-side providers (e.g. AccountProvider) can
 * respond.
 *
 * Security: the allowlist is managed on the host side. The iframe cannot
 * influence which subscription types are bridged.
 *
 * Protocol:
 *   iframe → host:  { type: "providers-bridge", id, selector }
 *   host → iframe:  { type: "providers-bridge-change", id, value }
 *   host → iframe:  { type: "providers-bridge-rejected", id }
 *   iframe → host:  { type: "providers-bridge-unsubscribe", id }
 */

import { log } from "./patchwork-isolation.js";

const DEFAULT_ALLOWED_TYPES = [
  "patchwork:contact",
  "patchwork:selected-doc",
];

interface ActiveSubscription {
  port: MessagePort;
  cleanup: () => void;
}

/**
 * Optional async filter applied to values before relaying them to the iframe.
 * Receives the subscription type and value; returns the (possibly modified)
 * value, or `undefined` to suppress the emission entirely.
 *
 * This can be used to check values against the allowlist and prompt the user
 * for access to URLs the iframe doesn't already know about.
 */
export type BridgeValueFilter = (
  selectorType: string,
  value: unknown
) => Promise<unknown | undefined> | unknown | undefined;

/**
 * Start the host-side providers bridge.
 *
 * @param rpcPort - The RPC MessagePort shared with the iframe
 * @param hostElement - The host DOM element to dispatch subscriptions on
 *   (typically the `<patchwork-isolation>` element, whose ancestors include
 *   the providers that should answer bridged subscriptions)
 * @param allowedTypes - Subscription types that may be bridged (default:
 *   `["patchwork:contact", "patchwork:selected-doc"]`)
 * @param valueFilter - Optional filter applied to values before relaying
 * @returns Cleanup function
 */
export function startHostProvidersBridge(
  rpcPort: MessagePort,
  hostElement: HTMLElement,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES,
  valueFilter?: BridgeValueFilter
): () => void {
  const allowed = new Set(allowedTypes);
  const active = new Map<number, ActiveSubscription>();

  const onMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!msg) return;

    if (msg.type === "providers-bridge") {
      const { id, selector } = msg as {
        id: number;
        selector: { type: string; [key: string]: unknown };
      };

      if (!allowed.has(selector.type)) {
        log(`providers-bridge rejected: ${selector.type}`);
        rpcPort.postMessage({ type: "providers-bridge-rejected", id });
        return;
      }

      log(`providers-bridge accepted: ${selector.type} (id=${id})`);

      // Create a MessageChannel for the host-side subscription
      const channel = new MessageChannel();
      const hostPort = channel.port2;

      // Listen for values from the host provider
      hostPort.addEventListener("message", async (e: MessageEvent) => {
        if (e.data?.type === "change") {
          const value = valueFilter
            ? await valueFilter(selector.type, e.data.value)
            : e.data.value;
          if (value === undefined) return;
          rpcPort.postMessage({
            type: "providers-bridge-change",
            id,
            value,
          });
        }
      });
      hostPort.start();

      // Dispatch a real patchwork:subscribe event on the host element
      // so ancestor providers (e.g. AccountProvider) can answer it
      hostElement.dispatchEvent(
        new CustomEvent("patchwork:subscribe", {
          detail: { selector, port: channel.port1 },
          bubbles: true,
          composed: true,
        })
      );

      const cleanup = () => {
        hostPort.postMessage({ type: "unsubscribe" });
        hostPort.close();
        channel.port1.close();
      };

      active.set(id, { port: hostPort, cleanup });
      return;
    }

    if (msg.type === "providers-bridge-unsubscribe") {
      const { id } = msg as { id: number };
      const sub = active.get(id);
      if (sub) {
        log(`providers-bridge unsubscribe (id=${id})`);
        sub.cleanup();
        active.delete(id);
      }
      return;
    }
  };

  rpcPort.addEventListener("message", onMessage);

  return () => {
    rpcPort.removeEventListener("message", onMessage);
    for (const [, sub] of active) {
      sub.cleanup();
    }
    active.clear();
  };
}

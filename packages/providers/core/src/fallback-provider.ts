import {
  accept,
  provide,
  type RequestEvent,
  type SubscribeEvent,
} from "./index.js";

declare global {
  interface HTMLElementTagNameMap {
    "fallback-provider": FallbackProviderElement;
  }
}

export interface FallbackProviderElement extends HTMLElement {}

/**
 * Defines the `<fallback-provider>` custom element. It catches any
 * `patchwork:request` or `patchwork:subscribe` that bubbles up to it and
 * resolves with `null`, ensuring request-promises always settle and
 * subscriptions always receive at least one value.
 */
export function registerFallbackProviderElement(
  name = "fallback-provider"
): void {
  if (customElements.get(name)) return;
  customElements.define(
    name,
    class extends HTMLElement implements FallbackProviderElement {
      #onRequest = (event: RequestEvent) => {
        provide(event, null);
      };

      #onSubscribe = (event: SubscribeEvent) => {
        accept(event, (respond) => {
          respond(null);
        });
      };

      connectedCallback() {
        if (!this.style.display) this.style.display = "contents";
        this.addEventListener("patchwork:request", this.#onRequest);
        this.addEventListener("patchwork:subscribe", this.#onSubscribe);
      }

      disconnectedCallback() {
        this.removeEventListener("patchwork:request", this.#onRequest);
        this.removeEventListener("patchwork:subscribe", this.#onSubscribe);
      }
    }
  );
}

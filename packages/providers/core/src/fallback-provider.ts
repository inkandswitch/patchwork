import { provide, type RequestEvent } from "./index.js";

declare global {
  interface HTMLElementTagNameMap {
    "fallback-provider": FallbackProviderElement;
  }
}

export interface FallbackProviderElement extends HTMLElement {}

/**
 * Defines the `<fallback-provider>` custom element. It catches any
 * `patchwork:request` that bubbles up to it and resolves with `null`,
 * ensuring request-promises always settle.
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

      connectedCallback() {
        if (!this.style.display) this.style.display = "contents";
        this.addEventListener("patchwork:request", this.#onRequest);
      }

      disconnectedCallback() {
        this.removeEventListener("patchwork:request", this.#onRequest);
      }
    }
  );
}

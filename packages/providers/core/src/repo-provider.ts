import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";

import { provide, type RequestEvent } from "./index.js";

declare global {
  interface HTMLElementTagNameMap {
    "repo-provider": RepoProviderElement;
  }
}

export interface RepoProviderElement extends HTMLElement {
  repo?: Repo;
}

/**
 * Defines the `<repo-provider>` custom element. It answers two request
 * types via the request/respond protocol:
 *
 * - `patchwork:repo` → resolves with the element's `.repo`
 * - `patchwork:dochandle` → resolves with `repo.find(detail.url)`
 *
 * Pass a `repo` to install it as the default for all instances of the
 * element; individual instances can still override via `.repo = ...`.
 */
export function registerRepoProviderElement(
  repo: Repo,
  name = "repo-provider"
): void {
  if (customElements.get(name)) return;
  customElements.define(
    name,
    class extends HTMLElement implements RepoProviderElement {
      repo: Repo = repo;

      #onRequest = (event: RequestEvent) => {
        const { type } = event.detail;
        if (type === "patchwork:repo") {
          provide<Repo>(event, this.repo);
          return;
        }
        if (type === "patchwork:dochandle") {
          const url = event.detail.url as AutomergeUrl | undefined;
          if (url) {
            provide<DocHandle<unknown>>(event, this.repo.find<unknown>(url));
          } else {
            provide<DocHandle<unknown>>(event, this.repo.create<unknown>());
          }
          return;
        }
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

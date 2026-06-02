import type { Repo } from "@automerge/automerge-repo";

declare global {
  interface HTMLElementTagNameMap {
    "repo-provider": RepoProviderElement;
  }
}

export interface RepoProviderElement extends HTMLElement {
  repo?: Repo;
}

/**
 * Defines the `<repo-provider>` custom element.
 *
 * It used to answer `patchwork:repo` / `patchwork:dochandle` requests, but the
 * repo is now published as a global (`globalThis.repo`) and handles are
 * recovered locally from it. The element is kept as a passive
 * `display: contents` wrapper that carries the repo on its `.repo` property for
 * any code that still reads it.
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

      connectedCallback() {
        if (!this.style.display) this.style.display = "contents";
      }
    }
  );
}

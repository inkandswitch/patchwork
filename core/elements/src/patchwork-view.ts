import {
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";

const State = {
  none: "none",
  initializing: "initializing",
  rendering: "rendering",
  unable: "unable",
  rendered: "rendered",
  error: "error",
} as const;

type State = (typeof State)[keyof typeof State];

export interface RegisterPatchworkViewElementParams {
  name?: string;
  repo: Repo;
}

export interface PatchworkViewElement extends HTMLElement {
  repo: Repo;
  docUrl: AutomergeUrl;
  toolUrl: string;
}

export function registerPatchworkViewElement(
  params: RegisterPatchworkViewElementParams
) {
  const name = params.name ?? "patchwork-view";
  const repo = params.repo;

  if (customElements.get(name)) {
    console.error(`can't redefine a custom element. defining "${name}"`);
    return;
  }

  const attrs = {
    docUrl: "doc-url",
    toolUrl: "tool-url",
  };

  customElements.define(
    name,
    class PatchworkViewElement extends HTMLElement {
      // attributes, if these change it's new game +
      #docUrl: AutomergeUrl | null = null;
      #toolUrl: string | null = null;
      #state: State = State.none;
      #handle: DocHandle<unknown> | null = null;
      #mount: any;

      get docUrl() {
        return this.#docUrl;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (this.#docUrl === url) return;
        this.#docUrl = url;
        const attr = this.getAttribute(attrs.docUrl);
        if (attr == url) return;
        if (url) {
          this.setAttribute(attrs.docUrl, url);
        } else {
          this.removeAttribute(attrs.docUrl);
        }
      }

      get toolUrl() {
        return this.#toolUrl;
      }

      set toolUrl(url: string | null) {
        if (this.#toolUrl === url) return;
        this.#toolUrl = url;
        const attr = this.getAttribute(attrs.toolUrl);
        if (attr == url) return;
        if (url) {
          this.setAttribute(attrs.toolUrl, url);
        } else {
          this.removeAttribute(attrs.toolUrl);
        }
      }

      static get observedAttributes() {
        return [attrs.docUrl, attrs.toolUrl];
      }

      connectedCallback() {
        this.docUrl = this.getAttribute(attrs.docUrl) as AutomergeUrl;
        this.toolUrl = this.getAttribute(attrs.toolUrl);
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      // When defined, this is called instead of connectedCallback() and disconnectedCallback()
      // each time the element is moved to a different place in the DOM via Element.moveBefore()
      connectedMoveCallback() {}

      attributeChangedCallback(name: string, _: string, val: string | null) {
        if (name === attrs.docUrl) {
          this.docUrl = val as AutomergeUrl;
          this.#teardown().then(() => this.#init());
        }

        if (name === attrs.toolUrl) {
          this.toolUrl = val;
          this.#teardown().then(() => this.#init());
        }
      }

      #init = async () => {
        if (!this.docUrl) {
          return;
        }

        this.#state = State.initializing;
        this.#handle = await repo.find<unknown>(this.docUrl);

        // if toolUrl is set, load the tool from the import URL
        if (this.#toolUrl) {
          const { mount } = await import(this.#toolUrl);
          this.#mount = mount;
        }

        this.#queueRender();
      };

      #teardowns = new Set<() => unknown | Promise<void>>();

      async #teardown() {
        if (this.#state == State.none) return;

        for (const fn of this.#teardowns) {
          await fn?.();
        }

        this.#teardowns.clear();
        this.#handle = null;
        this.replaceChildren();
        this.#state = State.none;
      }

      #queueRender() {
        if (this.#state == State.none) return;
        if (this.#state == State.rendering) return;
        this.#state = State.rendering;
        queueMicrotask(() => this.#render());
      }

      #render() {
        if (this.#state != State.rendering) return;

        if (!this.docUrl) {
          this.#state = State.unable;
          this.#displayError(`I need a doc URL to open.`);
          return;
        }
        if (!this.toolUrl) {
          this.#state = State.unable;
          this.#displayError(`I need a tool URL to open ${this.#docUrl}.`);
          return;
        }

        this.#resetDisplay();

        try {
          const unmount = this.#mount(this.#handle, this);
          this.#teardowns.add(unmount);
          this.#state = State.rendered;
        } catch (error) {
          this.#state = State.error;
          this.#displayError(`I couldn't mount the tool: ${error}`);
        }
      }

      #displayError = (error: string) => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        // TODO: no, don't do this.
        // wait a second then face in over half a second
        div.style.transition = "opacity 2s linear 2s";
        div.style.opacity = "0";
        div.innerHTML = /* html */ `
          <p>Oh no! ${error}</p>
        `;
        this.append(div);
        setTimeout(() => {
          div.style.opacity = "1";
        });
      };

      #resetDisplay = () => {
        this.replaceChildren();
      };
    }
  );
}

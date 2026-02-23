import {
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import { watchToolForDocument } from "./tool-resolution.js";

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
  toolId: string;
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
    toolId: "tool-id",
    toolUrl: "tool-url",
  };

  customElements.define(
    name,
    class PatchworkViewElement extends HTMLElement {
      #docUrl: AutomergeUrl | null = null;
      #toolId: string | null = null;
      #toolUrl: string | null = null;
      #resolvedToolUrl: string | null = null;
      #state: State = State.none;
      #handle: DocHandle<unknown> | null = null;
      #mount: any;
      #stopWatching: (() => void) | null = null;
      #initGeneration = 0;
      #reinitQueued = false;

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

      get toolId() {
        return this.#toolId;
      }

      set toolId(id: string | null) {
        if (this.#toolId === id) return;
        this.#toolId = id;
        const attr = this.getAttribute(attrs.toolId);
        if (attr == id) return;
        if (id) {
          this.setAttribute(attrs.toolId, id);
        } else {
          this.removeAttribute(attrs.toolId);
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

      get effectiveToolUrl(): string | null {
        return this.#toolUrl ?? this.#resolvedToolUrl;
      }

      static get observedAttributes() {
        return [attrs.docUrl, attrs.toolId, attrs.toolUrl];
      }

      connectedCallback() {
        this.#docUrl = this.getAttribute(attrs.docUrl) as AutomergeUrl;
        this.#toolId = this.getAttribute(attrs.toolId);
        this.#toolUrl = this.getAttribute(attrs.toolUrl);
        console.log(`[patchwork-view] connectedCallback`, { docUrl: this.#docUrl, toolId: this.#toolId, toolUrl: this.#toolUrl });
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      connectedMoveCallback() {}

      attributeChangedCallback(name: string, old: string, val: string | null) {
        console.log(`[patchwork-view] attributeChangedCallback`, { name, old, val });
        if (name === attrs.docUrl) {
          this.#docUrl = val as AutomergeUrl;
        } else if (name === attrs.toolId) {
          this.#toolId = val;
        } else if (name === attrs.toolUrl) {
          this.#toolUrl = val;
        }
        this.#scheduleReinit();
      }

      // Coalesce multiple synchronous attribute changes into one teardown+init cycle
      #scheduleReinit() {
        if (this.#reinitQueued) return;
        this.#reinitQueued = true;
        queueMicrotask(() => {
          this.#reinitQueued = false;
          this.#teardown().then(() => this.#init());
        });
      }

      #init = async () => {
        console.log(`[patchwork-view] #init`, { docUrl: this.#docUrl, toolId: this.#toolId, toolUrl: this.#toolUrl });
        if (!this.#docUrl) {
          console.log(`[patchwork-view] #init: no docUrl, returning`);
          return;
        }

        const generation = ++this.#initGeneration;
        this.#state = State.initializing;
        console.log(`[patchwork-view] #init: finding doc`, this.#docUrl, `gen=${generation}`);
        this.#handle = await repo.find<unknown>(this.#docUrl);
        console.log(`[patchwork-view] #init: doc found`, `gen=${generation}`, `current=${this.#initGeneration}`);

        if (generation !== this.#initGeneration) {
          console.log(`[patchwork-view] #init: stale generation, bailing`);
          return;
        }

        if (this.#toolUrl) {
          console.log(`[patchwork-view] #init: explicit toolUrl, loading`, this.#toolUrl);
          await this.#loadToolFromUrl(this.#toolUrl);
          if (generation !== this.#initGeneration) return;
          this.#queueRender();
        } else {
          console.log(`[patchwork-view] #init: starting watchToolForDocument`, { docUrl: this.#docUrl, toolId: this.#toolId });
          this.#stopWatching = watchToolForDocument(
            repo,
            this.#docUrl,
            { toolId: this.#toolId },
            (resolution) => {
              console.log(`[patchwork-view] watchToolForDocument callback`, { gen: generation, current: this.#initGeneration, selectedTool: resolution.selectedTool?.id, toolUrl: resolution.selectedTool?.toolUrl, availableCount: resolution.availableTools.length });
              if (generation !== this.#initGeneration) return;
              const tool = resolution.selectedTool;
              const newUrl = tool?.toolUrl ?? null;
              if (newUrl === this.#resolvedToolUrl) return;
              this.#resolvedToolUrl = newUrl;
              if (tool) {
                console.log(`[patchwork-view] tool resolved from registry`, tool.id);
                this.#mount = tool.mount;
                this.#queueRender();
              } else {
                console.log(`[patchwork-view] no tool resolved yet`);
              }
            }
          );
        }
      };

      async #loadToolFromUrl(url: string) {
        const { mount } = await import(url);
        this.#mount = mount;
      }

      #teardowns = new Set<() => unknown | Promise<void>>();

      async #teardown() {
        console.log(`[patchwork-view] #teardown`, { state: this.#state });
        if (this.#state == State.none) return;

        this.#stopWatching?.();
        this.#stopWatching = null;
        this.#resolvedToolUrl = null;

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
        console.log(`[patchwork-view] #render`, { state: this.#state, docUrl: this.#docUrl, effectiveToolUrl: this.effectiveToolUrl, hasMount: !!this.#mount });
        if (this.#state != State.rendering) return;

        if (!this.docUrl) {
          this.#state = State.unable;
          this.#displayError(`I need a doc URL to open.`);
          return;
        }
        if (!this.effectiveToolUrl) {
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

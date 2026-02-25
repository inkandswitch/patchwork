import {
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import { watchToolForDocument } from "./tool-resolution.js";
import { NoToolEvent } from "./events.js";

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
      #initController: AbortController | null = null;
      #reinitQueued = false;

      get repo() {
        return repo;
      }

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
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      connectedMoveCallback() {}

      attributeChangedCallback(name: string, old: string, val: string | null) {
        if (name === attrs.docUrl) {
          this.#docUrl = val as AutomergeUrl;
        } else if (name === attrs.toolId) {
          this.#toolId = val;
        } else if (name === attrs.toolUrl) {
          this.#toolUrl = val;
        }
        this.#scheduleReinit();
      }

      #scheduleReinit() {
        if (this.#reinitQueued) return;
        this.#reinitQueued = true;
        queueMicrotask(() => {
          this.#reinitQueued = false;
          this.#teardown().then(() => this.#init());
        });
      }

      #init = async () => {
        if (!this.#docUrl) return;

        this.#initController?.abort();
        this.#initController = new AbortController();
        const abortSignal = this.#initController.signal;

        this.#state = State.initializing;
        this.#handle = await repo.find<unknown>(this.#docUrl);
        if (abortSignal.aborted) return;

        if (this.#toolUrl) {
          await this.#loadToolFromUrl(this.#toolUrl);
          if (abortSignal.aborted) return;
          this.#queueRender();
        } else {
          this.#stopWatching = watchToolForDocument(
            repo,
            this.#docUrl,
            { toolId: this.#toolId },
            async (resolution) => {
              if (abortSignal.aborted) return;
              const tool = resolution.selectedTool;
              const newUrl = tool?.importUrl ?? null;
              if (newUrl === this.#resolvedToolUrl) return;
              this.#resolvedToolUrl = newUrl;
              if (tool) {
                await this.#loadToolFromUrl(tool.importUrl);
                if (abortSignal.aborted) return;
              }
              this.#queueRender();
            }
          );
        }
      };

      async #loadToolFromUrl(url: string) {
        const mod = await import(/* @vite-ignore */ url);
        this.#mount = mod.default;
      }

      #teardowns = new Set<() => unknown | Promise<void>>();

      async #teardown() {
        if (this.#state == State.none) return;

        this.#initController?.abort();
        this.#initController = null;
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
        if (this.#state != State.rendering) return;

        if (!this.docUrl) {
          this.#state = State.unable;
          this.#displayError(`I need a doc URL to open.`);
          return;
        }
        if (!this.effectiveToolUrl) {
          this.#state = State.unable;
          this.#displayError(`I need a tool URL to open ${this.#docUrl}.`);
          this.dispatchEvent(new NoToolEvent({ url: this.#docUrl }));
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

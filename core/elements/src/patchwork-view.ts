import {
  type AutomergeUrl,
  type DocHandle,
  type DocHandleChangePayload,
  type Repo,
} from "@automerge/automerge-repo";
import {
  getSuggestedImportUrl,
  getType,
  type HasPatchworkMetadata,
  type ModuleWatcher,
} from "@inkandswitch/patchwork-filesystem";
import {
  getFallbackTool,
  getRegistry,
  isLoadablePlugin,
  type LoadedTool,
} from "@inkandswitch/patchwork-plugins";
import { MountedEvent, NoToolEvent } from "./events.js";

import type { initializeAutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";

type AutomergeRepoKeyhive = Awaited<
  ReturnType<typeof initializeAutomergeRepoKeyhive>
>;

const State = {
  none: "none",
  initializing: "initializing",
  rendering: "rendering",
  unable: "unable",
  rendered: "rendered",
  fallback: "fallback",
  error: "error",
} as const;

type State = (typeof State)[keyof typeof State];

export interface RegisterPatchworkViewElementParams {
  name?: string;
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
}

export interface PatchworkViewElement extends HTMLElement {
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
  docUrl?: AutomergeUrl;
  toolId?: string;
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
  };

  customElements.define(
    name,
    class PatchworkViewElement extends HTMLElement {
      repo = repo;
      hive = params.hive;
      // attributes, if these change it's new game +
      #docUrl: AutomergeUrl | null = null;
      #toolId: string | null = null;
      #handle: DocHandle<HasPatchworkMetadata> | null = null;
      #tool: LoadedTool | null = null;
      #state: State = State.none;

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

      static get observedAttributes() {
        return [attrs.docUrl, attrs.toolId];
      }

      connectedCallback() {
        this.docUrl = this.getAttribute(attrs.docUrl) as AutomergeUrl;
        this.toolId = this.getAttribute(attrs.toolId);
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      // When defined, this is called instead of connectedCallback() and disconnectedCallback()
      // each time the element is moved to a different place in the DOM via Element.moveBefore()
      connectedMoveCallback() {}

      attributeChangedCallback(name: string, _: string, val: string | null) {
        if (name === attrs.toolId) {
          if (this.toolId != val) {
            this.toolId = val;
            this.#teardown().then(() => this.#init());
          }
        }

        if (name === attrs.docUrl) {
          this.docUrl = val as AutomergeUrl;
          this.#teardown().then(() => this.#init());
        }
      }

      #onDocChange = (
        payload: DocHandleChangePayload<HasPatchworkMetadata>
      ) => {
        const { before, after } = payload.patchInfo;

        if (getType(before) != getType(after)) {
          this.#teardown().then(() => this.#init());
        }
      };

      #init = async () => {
        const toolRegistry = getRegistry("patchwork:tool");
        if (this.#state != State.none) {
          return;
        }

        if (!this.docUrl) {
          return;
        }

        this.#state = State.initializing;

        this.#handle = await repo.find<HasPatchworkMetadata>(this.docUrl!);

        // TODO: these are inlined and not separate functions
        // because we need to do some work getting types working well here.
        // @chee would be good to chat about this at some point.
        const removeAddedListener = toolRegistry.on(
          "registered",
          async (addedTool) => {
            const toolId = addedTool.id;
            const isChosenTool = toolId == this.toolId;
            if (this.#handle) {
              this.#fallbackId = getFallbackTool(this.#handle.doc())?.id;
            }
            const isFallbackTool = toolId == this.#fallbackId;

            if (isChosenTool || isFallbackTool) {
              if (isLoadablePlugin(addedTool)) {
                // if it's not loaded, load it now
                toolRegistry.load(addedTool.id);
              }
            }
          }
        );

        const removeLoadedListener = toolRegistry.on(
          "loaded",
          async (loadedTool) => {
            const toolId = loadedTool.id;
            const isChosenTool = toolId == this.toolId;
            const isFallbackTool = toolId == this.#fallbackId;

            if (isChosenTool || isFallbackTool) {
              if (this.#state == "unable") {
                this.#queueRender();
              }

              if (
                ((this.#state == "error" || this.#state == "rendered") &&
                  isChosenTool) ||
                (this.#state == "fallback" && isFallbackTool)
              ) {
                if (loadedTool.importUrl !== this.#tool?.importUrl) {
                  await this.#teardown();
                  this.#init();
                }
              }
            }
          }
        );

        this.#teardowns.add(() => {
          removeAddedListener();
          removeLoadedListener();
        });

        this.#handle.on("change", this.#onDocChange);
        this.#teardowns.add(() =>
          this.#handle!.off("change", this.#onDocChange)
        );

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
        this.#tool = null;
        this.textContent = "";
        this.#state = State.none;
      }

      #queueRender() {
        if (this.#state == "none") return;
        if (this.#state == "rendering") return;
        this.#state = "rendering";
        queueMicrotask(() => this.#render());
      }

      #fallbackId: string | undefined;

      #render() {
        if (this.#state != "rendering") return;
        if (!this.docUrl || !this.#handle) {
          this.#state = "unable";
          return;
        }

        // Clear any previous content and error styles
        this.#resetDisplay();

        const doc = this.#handle.doc();
        this.#fallbackId = getFallbackTool(doc)?.id;
        const fallingBack = !this.toolId;
        const toolId = this.toolId || this.#fallbackId;

        if (fallingBack) {
          console.warn(
            `falling back to default tool for ${this.#docUrl}. attempting to load suggested import URL`
          );
          this.dispatchEvent(new NoToolEvent({ url: this.docUrl }));
        }

        if (!toolId) {
          this.#state = "unable";
          // Check if the document is missing @patchwork metadata
          const hasPatchworkMetadata = doc && "@patchwork" in doc;
          if (!hasPatchworkMetadata) {
            console.warn(
              `Document ${this.#docUrl} is missing @patchwork metadata`
            );
            this.#displayError(
              `This document is missing @patchwork metadata and cannot be opened.`
            );
          } else {
            console.warn(`no tool for ${this.#docUrl}`);
            this.#displayError(
              `I couldn't find a tool to open ${this.#docUrl}.`
            );
          }
          return;
        }

        this.#tool =
          getRegistry<LoadedTool>("patchwork:tool").get(toolId) ?? null;

        if (!this.#tool) {
          this.#state = "unable";
          console.warn("Tool not found", toolId, "available tools:", getRegistry<LoadedTool>("patchwork:tool").all().map(t => t.id));
          this.#displayError(`I couldn't find the tool with id ${toolId}.`);
          console.log("dispatching patchwork:no-tool for", this.docUrl);
          this.dispatchEvent(new NoToolEvent({ url: this.docUrl }));
          return;
        }

        if (!this.#tool.module) {
          const toolRegistry = getRegistry("patchwork:tool");
          toolRegistry.load(this.#tool.id);
          if (toolRegistry.loading.has(this.#tool.id)) {
            this.#state = "unable";
            console.log(`loading ${toolId}`);
            this.#displayLoading(toolId);
          } else {
            this.#state = "unable";
            console.warn("Tool not loaded", toolId);
            this.#displayError(`I couldn't load the tool with id ${toolId}.`);
          }
          return;
        }

        try {
          const cleanup = this.#tool.module(this.#handle, this);
          if (typeof cleanup != "function") {
            console.warn(`return a cleanup function from ${toolId}`);
          }
          this.#teardowns.add(cleanup);
          this.#state = fallingBack ? "fallback" : "rendered";
          this.dispatchEvent(new MountedEvent({ url: this.docUrl, toolId }));
        } catch (error) {
          this.append(
            Object.assign(document.createElement("div"), {
              innerHTML: /* html */ `
                <p>oh no!</p>
                <details>
                  <summary>${(error as Error).message ?? error}</summary>
                  <pre style="white-space: pre-wrap;">${(error as Error).stack ?? ""}</pre>
                </details>
              `,
            })
          );
          console.error(error);

          this.#state = "error";
        }
      }

      #displayLoading = (toolId: string) => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.height = "100%";
        div.innerHTML = /* html */ `
          <style>
            @keyframes pw-loading-spin {
              to { transform: rotate(360deg); }
            }
          </style>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="
              width: 24px;
              height: 24px;
              border: 3px solid #e0e0e0;
              border-top-color: #888;
              border-radius: 50%;
              animation: pw-loading-spin 0.8s linear infinite;
            "></div>
            <div style="font-size: 12px; color: #888;">loading ${toolId}</div>
          </div>
        `;
        this.append(div);
      };

      #displayError = (error: string) => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        // wait a second then face in over half a second
        div.style.transition = "opacity 2s linear 2s";
        div.style.opacity = "0";
        div.innerHTML = /* html */ `
          <details style="display: flex"><summary></summary><pre style="white-space: pre-wrap;"><code>${error}</code></pre></details>
        `;
        this.append(div);
        setTimeout(() => {
          div.style.opacity = "1";
        });
      };

      #resetDisplay = () => {
        this.replaceChildren();
        this.style.display = "";
        this.style.alignItems = "";
        this.style.justifyContent = "";
      };
    }
  );
}

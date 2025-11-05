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
  ModuleWatcher,
} from "@patchwork/filesystem";
import {
  getFallbackTool,
  getPlugin,
  getPluginRegistry,
  isLoadablePlugin,
  onPluginsChange,
  type LoadablePlugin,
  type Tool,
} from "@patchwork/plugins";

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
  // todo do not need the below when tools are URLs
  moduleWatcher: ModuleWatcher;
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
  const moduleWatcher = params.moduleWatcher;

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
      #tool: Tool | null = null;
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

        if (getSuggestedImportUrl(before) != getSuggestedImportUrl(after)) {
          this.#teardown().then(() => this.#init());
        }

        if (getType(before) != getType(after)) {
          this.#teardown().then(() => this.#init());
        }
      };

      #init = async () => {
        const toolRegistry = getPluginRegistry("patchwork:tool");
        if (this.#state != State.none) {
          return;
        }

        if (!this.docUrl) {
          return;
        }

        this.#state = State.initializing;

        this.#handle = await repo.find<HasPatchworkMetadata>(this.docUrl!);

        /*        moduleWatcher.loadSuggestedImportUrl(this.docUrl).catch(() => {
          console.warn(
            `couldn't load suggested import url for ${this.docUrl}`,
            new Error().stack
          );
        }); */

        this.#teardowns.add(
          onPluginsChange<Tool>("patchwork:tool", async (_tools, newTool) => {
            const newToolId = newTool.id;
            const isChosenTool = newToolId == this.toolId;
            const isFallbackTool = newToolId == this.#fallbackId;
            if (isChosenTool || isFallbackTool) {
              if (isLoadablePlugin(newTool) && !newTool.module) {
                // if it's not loaded, load it now
                await toolRegistry.load(newTool.id);

                // probably a hot reload
                if (!newTool.module) {
                  await newTool.load();
                }
              }

              if (this.#state == "unable") {
                this.#queueRender();
              }

              if (this.#state == "error" || this.#state == "rendered") {
                if (newTool.importUrl !== this.#tool?.importUrl) {
                  await this.#teardown();
                  this.#init();
                }
              }
            }
          })
        );

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

        this.#fallbackId = getFallbackTool(this.#handle.doc())?.id;
        const fallingBack = !this.toolId;

        const toolId = this.toolId ?? this.#fallbackId;

        if (!toolId) {
          console.warn(`no tool for ${this.#docUrl}`);
        }

        this.#tool = getPlugin<Tool>("patchwork:tool", toolId) ?? null;

        if (!this.#tool) {
          console.warn("Tool not found", toolId);
          this.#state = "unable";
          return;
        }

        if (!this.#tool.module) {
          getPluginRegistry("patchwork:tool").load(this.#tool.id);
          this.#state = "unable";
          console.warn("Tool not loaded", toolId);
          return;
        }

        try {
          const cleanup = this.#tool.module(this.#handle, this);
          if (typeof cleanup != "function") {
            console.warn(`return a cleanup function from ${toolId}`);
          }
          this.#teardowns.add(cleanup);
          this.#state = fallingBack ? "fallback" : "rendered";
        } catch (error) {
          this.append(
            Object.assign(document.createElement("div"), {
              innerHTML: /* html */ `
                <p>oh no!</p>
                <details>
                  <summary>${(error as Error).message ?? error}</summary>
                  <pre>${(error as Error).stack ?? ""}</pre>
              </details>
              `,
            })
          );
          console.error(error);

          this.#state = "error";
        }
      }
    }
  );
}

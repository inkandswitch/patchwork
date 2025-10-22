import {
  type AutomergeUrl,
  type DocHandle,
  type DocHandleChangePayload,
  type Repo,
} from "@automerge/automerge-repo";
import {
  getSuggestedImportUrl,
  getType,
  ModuleWatcher,
  type HasPatchworkMetadata,
} from "@patchwork/filesystem";
import {
  getLoadedFallbackToolId,
  getPlugin,
  getPluginRegistry,
  isLoadablePlugin,
  onPluginsChange,
  type Tool,
} from "@patchwork/plugins";

import type { initializeKeyhive } from "@automerge/automerge-repo-keyhive";
type AutomergeRepoKeyhive = Awaited<ReturnType<typeof initializeKeyhive>>;

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

      get docUrl() {
        return this.#docUrl;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (this.#docUrl === url) return;
        this.#docUrl = url;
        if (url) {
          this.setAttribute("doc-url", url);
        } else {
          this.removeAttribute("doc-url");
        }
      }

      get toolId() {
        return this.#toolId;
      }

      set toolId(id: string | null) {
        if (this.#toolId === id) return;
        this.#toolId = id;
        if (id) {
          this.setAttribute("tool-id", id);
        } else {
          this.removeAttribute("tool-id");
        }
      }

      static get observedAttributes() {
        return ["doc-url", "tool-id"];
      }

      connectedCallback() {
        this.docUrl = this.getAttribute("doc-url") as AutomergeUrl;
        this.toolId = this.getAttribute("tool-id");
        this.#reinit();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      attributeChangedCallback(name: string, _: string, val: string | null) {
        if (name === "tool-id") {
          if (this.toolId != val) {
            this.toolId = val;
            this.#reinit();
          }
        }

        if (name === "doc-url") {
          this.docUrl = val as AutomergeUrl;
          this.#reinit();
        }
      }

      #onDocChange = (
        payload: DocHandleChangePayload<HasPatchworkMetadata>
      ) => {
        const { before, after } = payload.patchInfo;
        if (getSuggestedImportUrl(before) != getSuggestedImportUrl(after)) {
          this.#reinit();
        }

        if (getType(before) != getType(after)) {
          this.#reinit();
        }
      };

      async #reinit() {
        this.#teardown();
        if (!this.docUrl) return;
        this.#handle = await repo.find<HasPatchworkMetadata>(this.docUrl!);
        moduleWatcher.loadSuggestedImportUrl(this.docUrl);

        if (!this.toolId) {
          this.toolId = await getLoadedFallbackToolId(this.#handle.doc());
        }

        this.#teardowns.add(
          onPluginsChange<Tool>("patchwork:tool", async (_tools, newTool) => {
            if (newTool?.id == this.toolId) {
              const toolRegistry = getPluginRegistry("patchwork:tool");
              if (!newTool.module && !toolRegistry.isLoading(newTool.id)) {
                // if it's not loaded, loading it will cause onPluginsChange
                // to fire again when it's ready
                toolRegistry.loadById(newTool.id);
              }
              // when a tool has updated we should rerender from scratch
              if (this.#tool) {
                this.#tool = null;
                this.#reinit();
              } else {
                // if we never had a tool we can try rendering again
                this.#queueRender();
              }
            }
          })
        );

        this.#handle.on("change", this.#onDocChange);
        this.#teardowns.add(() =>
          this.#handle!.off("change", this.#onDocChange)
        );

        this.#queueRender();
      }

      #teardowns = new Set<() => void>();

      #teardown() {
        for (const fn of this.#teardowns) {
          fn?.();
        }
        this.#teardowns.clear();
        this.#handle = null;
        this.textContent = "";
        this.#tool = null;
      }

      #renderQueued = false;
      #queueRender() {
        if (this.#renderQueued) return;
        this.#renderQueued = true;
        queueMicrotask(() => this.#render());
      }

      #render() {
        if (this.#tool) {
          this.#renderQueued = false;
          return;
        }

        if (!this.docUrl || !this.toolId || !this.#handle) {
          this.#renderQueued = false;
          return;
        }

        this.#tool = getPlugin<Tool>("patchwork:tool", this.toolId) ?? null;

        if (!this.#tool) {
          console.warn("No such tool", this.toolId);
          this.#renderQueued = false;
          return;
        }

        if (!this.#tool.module) {
          //console.warn("Tool not loaded", this.toolId);
          this.#renderQueued = false;
          return;
        }

        try {
          const cleanup = this.#tool.module(this.#handle, this);
          if (typeof cleanup != "function") {
            console.warn(`return a cleanup function from ${this.toolId}`);
          }
          this.#teardowns.add(cleanup);
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
          this.#tool = null;
        } finally {
          this.#renderQueued = false;
        }
      }
    }
  );
}

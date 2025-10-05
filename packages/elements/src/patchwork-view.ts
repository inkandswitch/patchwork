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
} from "@patchwork/filesystem";
import {
  getLoadedPlugin,
  onPluginsChange,
  type Tool,
} from "@patchwork/plugins";

interface RegisterPatchworkViewElementParams {
  name?: string;
  shadow?: false | "open" | "closed";
  repo: Repo;

  // todo do not need the below whens tools are URLs
  moduleWatcher: ModuleWatcher;
}

export function registerPatchworkViewElement(
  params: RegisterPatchworkViewElementParams
) {
  const name = params.name ?? "patchwork-view";
  const useShadow = params.shadow !== false;
  const shadowMode = typeof params.shadow == "string" ? params.shadow : "open";
  const repo = params.repo;
  const moduleWatcher = params.moduleWatcher;
  if (customElements.get(name)) {
    console.error(`can't redefine a custom element. defining "${name}"`);
    return;
  }

  customElements.define(
    name,
    class RootstockTool extends HTMLElement {
      // attributes, if these change it's new game +
      #docUrl: AutomergeUrl | null = null;
      #toolId: string | null = null;
      #handle: DocHandle<HasPatchworkMetadata> | null = null;
      #tool: Tool | null = null;

      get rootElement(): ShadowRoot | HTMLElement {
        return useShadow ? this.shadowRoot! : this;
      }

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

      constructor() {
        super();
        if (useShadow) {
          this.attachShadow({ mode: shadowMode });
        }
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
        if (!this.toolId) return;

        this.#teardowns.add(
          onPluginsChange("patchwork:tool", (tools) => {
            if (!this.#tool && tools.find((tool) => this.toolId == tool.id)) {
              this.#queueRender();
            }
          })
        );
        this.#handle = await repo.find<HasPatchworkMetadata>(this.docUrl!);
        moduleWatcher.loadSuggestedImportUrl(this.docUrl);
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
        this.rootElement!.textContent = "";
        this.#tool = null;
      }

      #renderQueued = false;
      #queueRender() {
        if (this.#renderQueued) return;
        this.#renderQueued = true;
        queueMicrotask(() => this.#render());
      }

      async #render() {
        if (this.#tool) {
          this.#renderQueued = false;
          return;
        }

        if (!this.docUrl || !this.toolId || !this.#handle) {
          this.#renderQueued = false;
          return;
        }

        this.#tool = ((await getLoadedPlugin("patchwork:tool", this.toolId)) ??
          null) as Tool | null;

        if (!this.#tool) {
          console.warn("No such tool", this.toolId);
          this.#renderQueued = false;
          return;
        }

        this!.textContent = "";

        // todo change signature to render(handle, element)
        // let them get repo, keyhive etc via a singleton import(?)
        // the plugin system is prior art here
        // if not that then maybe render(handle, element, {repo, keyhive})
        const cleanup = this.#tool.module.render?.({
          handle: this.#handle,
          element: this.rootElement,
          repo,
        });
        cleanup && this.#teardowns.add(cleanup);
        this.#renderQueued = false;
      }
    }
  );
}

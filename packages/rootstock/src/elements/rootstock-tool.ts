import type { HasPatchworkMetadata } from "../modules/types.js";
import { getLoadedPlugin, onPluginsChange } from "../plugins/index.js";
import type { Tool } from "../plugins/tools.js";
import type {
  AutomergeUrl,
  DocHandle,
  DocHandleChangePayload,
} from "@automerge/automerge-repo";
import shim from "@patchwork/rootstock-patchwork-react-shim";
import debug from "debug";
const log = debug("rootstock:elements:rootstock-tool");

function getType(doc: HasPatchworkMetadata) {
  return doc["@patchwork"].type;
}

function getSuggestedImportUrl(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.suggestedImportUrl;
}

// todo(chee): enable this when patchwork tools understand they should put their
// css in the shadows
const USE_SHADOWROOT = false;

export class RootstockTool extends HTMLElement {
  // attributes, if these change it's new game +
  #docUrl: AutomergeUrl | null = null;
  #toolId: string | null = null;
  #handle: DocHandle<HasPatchworkMetadata> | null = null;
  #tool: Tool | null = null;

  get rootElement(): ShadowRoot | HTMLElement {
    return USE_SHADOWROOT ? this.shadowRoot! : this;
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
    if (USE_SHADOWROOT) {
      this.attachShadow({ mode: "open" });
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

  #onDocChange = (payload: DocHandleChangePayload<HasPatchworkMetadata>) => {
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
    // todo should repo be settable as a prop?
    if (!window.repo) throw new Error("No repo");
    // todo should moduleWatcher be settable as a prop?
    if (!window.moduleWatcher) throw new Error("No module watcher");
    log("setup", {
      docUrl: this.docUrl,
      toolId: this.toolId,
    });

    this.#teardowns.add(
      onPluginsChange("patchwork:tool", (tools) => {
        if (!this.#tool && tools.find((tool) => this.toolId == tool.id)) {
          this.#queueRender();
        }
      })
    );
    this.#handle = await window.repo.find<HasPatchworkMetadata>(this.docUrl!);
    const suggestedImportUrl = getSuggestedImportUrl(this.#handle.doc());
    suggestedImportUrl &&
      window.moduleWatcher.loadModules([suggestedImportUrl]);
    this.#handle.on("change", this.#onDocChange);
    this.#teardowns.add(() => this.#handle!.off("change", this.#onDocChange));
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
    log("render", {
      docUrl: this.docUrl,
      toolId: this.toolId,
      handleUrl: this.#handle?.url,
    });
    // i already found a friend
    if (this.#tool) {
      log("already have a tool, skipping render");
      this.#renderQueued = false;
      return;
    }

    if (!this.docUrl || !this.toolId || !this.#handle) {
      this.#renderQueued = false;
      return;
    }

    log("rendering", {
      docUrl: this.docUrl,
      toolId: this.toolId,
    });

    this.#tool = ((await getLoadedPlugin("patchwork:tool", this.toolId)) ??
      null) as Tool | null;

    if (!this.#tool) {
      console.warn("No such tool", this.toolId);
      this.#renderQueued = false;
      return;
    }

    this!.textContent = "";
    if (this.#tool.module.render) {
      log("rendering with tool's render()");
      const teardown = this.#tool.module.render({
        // todo: should this be handle or docUrl?
        handle: this.#handle,
        // todo: naming
        element: this.rootElement!,
        repo: window.repo,
      });
      teardown && this.#teardowns.add(teardown);
    } else if (this.#tool.module.EditorComponent) {
      log("falling back to legacy patchwork react shim");
      this.#teardowns.add(
        (await shim(this.#tool.module.EditorComponent))({
          handle: this.#handle,
          element: this.rootElement!,
          repo: window.repo,
        })
      );
    }
    this.#renderQueued = false;
  }
}

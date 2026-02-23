import { type AutomergeUrl, type Repo } from "@automerge/automerge-repo";
import {
  watchToolForDocument,
  type ToolOption,
  type ToolResolution,
} from "./tool-resolution.js";
import { ToolSelectedEvent } from "./events.js";

export interface RegisterPatchworkToolPickerElementParams {
  name?: string;
  viewName?: string;
  repo: Repo;
}

export function registerPatchworkToolPickerElement(
  params: RegisterPatchworkToolPickerElementParams
) {
  const name = params.name ?? "patchwork-tool-picker";
  const viewName = params.viewName ?? "patchwork-view";
  const repo = params.repo;

  if (customElements.get(name)) {
    console.error(`can't redefine a custom element. defining "${name}"`);
    return;
  }

  const attrs = {
    docUrl: "doc-url",
    toolId: "tool-id",
    for: "for",
    headless: "headless",
  };

  customElements.define(
    name,
    class PatchworkToolPickerElement extends HTMLElement {
      #docUrl: AutomergeUrl | null = null;
      #toolId: string | null = null;
      #resolution: ToolResolution = {
        selectedTool: null,
        availableTools: [],
      };
      #stopWatching: (() => void) | null = null;
      #shadow: ShadowRoot;

      constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: "open" });
      }

      get docUrl() {
        return this.#docUrl;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (this.#docUrl === url) return;
        this.#docUrl = url;
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
        if (id) {
          this.setAttribute(attrs.toolId, id);
        } else {
          this.removeAttribute(attrs.toolId);
        }
      }

      get selectedTool(): ToolOption | null {
        return this.#resolution.selectedTool;
      }

      get availableTools(): ToolOption[] {
        return this.#resolution.availableTools;
      }

      static get observedAttributes() {
        return [attrs.docUrl, attrs.toolId, attrs.for, attrs.headless];
      }

      connectedCallback() {
        this.#docUrl = this.getAttribute(attrs.docUrl) as AutomergeUrl;
        this.#toolId = this.getAttribute(attrs.toolId);
        this.#startWatching();
      }

      disconnectedCallback() {
        this.#stopWatching?.();
        this.#stopWatching = null;
      }

      connectedMoveCallback() {}

      attributeChangedCallback(
        attrName: string,
        _old: string,
        val: string | null
      ) {
        if (attrName === attrs.docUrl) {
          this.#docUrl = val as AutomergeUrl;
          this.#restart();
        } else if (attrName === attrs.toolId) {
          this.#toolId = val;
          this.#restart();
        } else if (attrName === attrs.headless) {
          this.#renderUI();
        }
      }

      #restart() {
        this.#stopWatching?.();
        this.#stopWatching = null;
        this.#startWatching();
      }

      #startWatching() {
        if (!this.#docUrl) return;

        this.#stopWatching = watchToolForDocument(
          repo,
          this.#docUrl,
          { toolId: this.#toolId },
          (resolution) => {
            this.#resolution = resolution;
            this.#onResolutionChanged();
          }
        );
      }

      #onResolutionChanged() {
        this.#renderUI();
        this.#updateTargetView();

        this.dispatchEvent(
          new ToolSelectedEvent({
            toolUrl: this.#resolution.selectedTool?.toolUrl ?? null,
            toolId: this.#resolution.selectedTool?.id ?? null,
          })
        );
      }

      #updateTargetView() {
        const view = this.#findTargetView();
        if (!view || !this.#resolution.selectedTool) return;
        view.setAttribute("tool-url", this.#resolution.selectedTool.toolUrl);
        if (this.#docUrl && !view.getAttribute("doc-url")) {
          view.setAttribute("doc-url", this.#docUrl);
        }
      }

      #findTargetView(): Element | null {
        const forAttr = this.getAttribute(attrs.for);
        if (forAttr) {
          const root = this.getRootNode() as Document | ShadowRoot;
          return root.querySelector(forAttr);
        }
        // Look for a sibling view first, then a child
        const sibling = this.parentElement?.querySelector(viewName);
        if (sibling && sibling !== this) return sibling;
        return this.querySelector(viewName);
      }

      selectTool(toolId: string) {
        const tool = this.#resolution.availableTools.find(
          (t) => t.id === toolId
        );
        if (!tool) return;
        this.#resolution = { ...this.#resolution, selectedTool: tool };
        this.#onResolutionChanged();
      }

      #renderUI() {
        if (this.hasAttribute(attrs.headless)) {
          this.#shadow.innerHTML = "";
          return;
        }

        const { selectedTool, availableTools } = this.#resolution;

        if (availableTools.length <= 1) {
          this.#shadow.innerHTML = "";
          return;
        }

        const options = availableTools
          .map(
            (t) =>
              `<option value="${t.id}"${t.id === selectedTool?.id ? " selected" : ""}>${t.name}</option>`
          )
          .join("");

        this.#shadow.innerHTML = /* html */ `
          <style>
            :host {
              display: inline-block;
            }
            select {
              font: inherit;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 2px 6px;
              background: #fff;
              cursor: pointer;
            }
            select:hover {
              border-color: #999;
            }
          </style>
          <select part="select">${options}</select>
        `;

        this.#shadow
          .querySelector("select")!
          .addEventListener("change", (e) => {
            const select = e.target as HTMLSelectElement;
            this.selectTool(select.value);
          });
      }
    }
  );
}

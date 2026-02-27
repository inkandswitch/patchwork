import { type AutomergeUrl, type Repo } from "@automerge/automerge-repo";
import {
  watchToolForDocument,
  type ToolOption,
  type ToolResolution,
} from "./tool-resolution.js";
import { ToolSelectedEvent } from "./events.js";
import {
  getRegistry,
  type ToolDescription,
} from "@inkandswitch/patchwork-plugins";

export interface RegisterPatchworkToolPickerElementParams {
  name?: string;
  repo: Repo;
}

export interface PatchworkToolPickerElement extends HTMLElement {
  docUrl: AutomergeUrl | null;
  toolId: string | null;
  readonly selectedTool: ToolOption | null;
  readonly availableTools: ToolOption[];
  selectTool(toolId: string, branch?: string): void;
  getBranchesForTool(toolId: string): ToolDescription[];
}

export function registerPatchworkToolPickerElement(
  params: RegisterPatchworkToolPickerElementParams
) {
  const name = params.name ?? "patchwork-tool-picker";
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
    class PatchworkToolPickerElement extends HTMLElement {
      #docUrl: AutomergeUrl | null = null;
      #toolId: string | null = null;
      #resolution: ToolResolution = {
        selectedTool: null,
        availableTools: [],
      };
      #stopWatching: (() => void) | null = null;

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
        return [attrs.docUrl, attrs.toolId];
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
            this.dispatchEvent(
              new ToolSelectedEvent({
                toolUrl: resolution.selectedTool?.importUrl ?? "",
                toolId: resolution.selectedTool?.id ?? "",
              })
            );
          }
        );
      }

      selectTool(toolId: string, branch?: string) {
        const toolRegistry = getRegistry<ToolDescription>("patchwork:tool");

        let tool: ToolOption | undefined;
        if (branch) {
          const desc = toolRegistry.getBranch(toolId, branch);
          if (desc?.importUrl) {
            tool = {
              id: desc.id,
              name: desc.name,
              importUrl: desc.importUrl,
              icon: desc.icon,
              branch: desc.branch,
              sourceDocUrl: desc.sourceDocUrl,
            };
          }
        }

        if (!tool) {
          tool = this.#resolution.availableTools.find((t) => t.id === toolId);
        }

        if (!tool) return;
        this.#resolution = { ...this.#resolution, selectedTool: tool };
        this.dispatchEvent(
          new ToolSelectedEvent({
            toolUrl: tool.importUrl,
            toolId: tool.id,
          })
        );
      }

      getBranchesForTool(toolId: string): ToolDescription[] {
        const toolRegistry = getRegistry<ToolDescription>("patchwork:tool");
        return toolRegistry.getVersions(toolId);
      }
    }
  );
}

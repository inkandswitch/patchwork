import { LitElement, html, nothing } from "lit";
import type { DocHandle } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import { runTransformChain, getAvailableTransforms } from "../pipes/transforms/registry";
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements";
import type { PatchworkPreviewElement } from "./patchwork-preview";

import "../pipes/transforms/latex-to-html";
import "../pipes/transforms/passthrough";

const TAG = "patchwork-pipe";

export class PatchworkPipeElement extends LitElement {
  static properties = {
    editing: { type: Boolean, reflect: true },
    _editorOpen: { state: true },
    _showPicker: { state: true },
  };

  declare editing: boolean;
  declare _editorOpen: boolean;
  declare _showPicker: boolean;

  constructor() {
    super();
    this.editing = false;
    this._editorOpen = false;
    this._showPicker = false;
  }

  #cleanup: (() => void) | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  createRenderRoot() {
    return this;
  }

  get transforms(): string[] {
    const attr = this.getAttribute("transforms");
    if (!attr) return [];
    return attr.split(",").map((s) => s.trim()).filter(Boolean);
  }

  set transforms(list: string[]) {
    if (list.length === 0) {
      this.removeAttribute("transforms");
    } else {
      this.setAttribute("transforms", list.join(","));
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.#applyDisplayStyles();
    this.#setupPipe();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#teardownPipe();
  }

  connectedMoveCallback() {}

  updated(_changed: Map<string, unknown>) {
    this.#applyDisplayStyles();
  }

  #applyDisplayStyles() {
    if (this.editing) {
      this.style.display = "flex";
      this.style.alignItems = "center";
      this.style.justifyContent = "center";
      this.style.flexShrink = "0";

      const parentDir = this.parentElement?.getAttribute("direction");
      if (parentDir === "vertical") {
        this.style.height = "8px";
        this.style.width = "100%";
        this.style.cursor = "row-resize";
      } else {
        this.style.width = "8px";
        this.style.height = "100%";
        this.style.cursor = "col-resize";
      }
    } else {
      this.style.display = "none";
      this._editorOpen = false;
      this._showPicker = false;
    }
  }

  render() {
    if (!this.editing) return nothing;

    const t = this.transforms;
    const indicatorText = t.length > 0 ? t.join(" → ") : "⊕";
    const indicatorTitle = t.length > 0 ? "Edit pipe" : "Configure pipe";

    return html`
      <button
        class="pipe-indicator"
        title=${indicatorTitle}
        @click=${this.#toggleEditor}
      >${indicatorText}</button>
      ${this._editorOpen ? this.#renderEditor() : nothing}
    `;
  }

  #toggleEditor = () => {
    this._editorOpen = !this._editorOpen;
    this._showPicker = false;
  };

  #renderEditor() {
    const current = this.transforms;
    const available = getAvailableTransforms();

    return html`
      <div class="pipe-editor">
        <div class="pipe-editor-header">
          <span>Pipe transforms</span>
          <button class="pipe-editor-close" @click=${() => { this._editorOpen = false; }}>×</button>
        </div>
        <div class="pipe-editor-body">
          ${current.length === 0
            ? html`<div class="pipe-editor-empty">No transforms — data passes through unchanged</div>`
            : current.map((t) => html`
                <div class="pipe-editor-transform">
                  <span>${t}</span>
                  <button class="pipe-editor-transform-remove" @click=${() => this.#removeTransform(t)}>×</button>
                </div>
              `)}
          ${this._showPicker
            ? html`
                <div class="pipe-editor-picker">
                  ${available.map((desc) => html`
                    <button class="pipe-editor-picker-item" @click=${() => this.#addTransform(desc.type)}>
                      ${desc.name}
                    </button>
                  `)}
                </div>
              `
            : html`
                <button class="pipe-editor-add-btn" @click=${() => { this._showPicker = true; }}>
                  + Add transform
                </button>
              `}
        </div>
        <div class="pipe-editor-actions">
          <button
            class="pipe-editor-action-btn pipe-editor-action-btn--danger"
            @click=${this.#deletePipe}
          >Delete pipe</button>
        </div>
      </div>
    `;
  }

  #removeTransform(t: string) {
    this.transforms = this.transforms.filter((x) => x !== t);
    this.#teardownPipe();
    this.#setupPipe();
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true }));
  }

  #addTransform(type: string) {
    this.transforms = [...this.transforms, type];
    this._showPicker = false;
    this.#teardownPipe();
    this.#setupPipe();
    this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true }));
  }

  #deletePipe = () => {
    this.dispatchEvent(new CustomEvent("pipe:delete", {
      detail: { id: this.id },
      bubbles: true,
    }));
    this.remove();
  };

  // ---- Pipe execution ----

  #findSource(): { handle: DocHandle<any>; view: PatchworkViewElement } | null {
    let el: Element | null = this.previousElementSibling;
    while (el && el.tagName.toLowerCase() === TAG) {
      el = el.previousElementSibling;
    }
    if (!el) return null;
    const view = el.tagName.toLowerCase() === "patchwork-view"
      ? (el as PatchworkViewElement)
      : (el.querySelector("patchwork-view") as PatchworkViewElement | null);
    if (!view?.docUrl || !view?.repo) return null;
    const handle = view.repo.find(view.docUrl);
    return handle ? { handle, view } : null;
  }

  #findTarget(): PatchworkPreviewElement | null {
    let el: Element | null = this.nextElementSibling;
    while (el && el.tagName.toLowerCase() === TAG) {
      el = el.nextElementSibling;
    }
    if (!el) return null;
    if (el.tagName.toLowerCase() === "patchwork-preview") {
      return el as PatchworkPreviewElement;
    }
    return el.querySelector("patchwork-preview") as PatchworkPreviewElement | null;
  }

  #setupPipe() {
    this.#teardownPipe();
    const types = this.transforms;
    if (types.length === 0) return;

    const timer = setTimeout(() => {
      const source = this.#findSource();
      const target = this.#findTarget();
      if (!source || !target) return;

      const runPipe = async () => {
        try {
          const doc = source.handle.doc();
          if (!doc) return;
          const result = await runTransformChain(types, doc);
          if (result !== null) target.value = result;
        } catch (e) {
          console.error("Pipe error:", e);
        }
      };

      const onChange = () => {
        if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
        this.#debounceTimer = setTimeout(runPipe, 300);
      };

      source.handle.on("change", onChange);
      runPipe();

      this.#cleanup = () => {
        source.handle.off("change", onChange);
        if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
      };
    }, 100);

    this.#cleanup = () => clearTimeout(timer);
  }

  #teardownPipe() {
    this.#cleanup?.();
    this.#cleanup = null;
  }
}

export function registerPatchworkPipe() {
  if (customElements.get(TAG)) return;
  customElements.define(TAG, PatchworkPipeElement);
}

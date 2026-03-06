import { LitElement, html, nothing } from "lit";
import type { DocHandle } from "@automerge/automerge-repo";
import {
  getTransformRegistry,
  loadTransform,
  type LoadedTransform,
} from "../transforms";
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements";
import type { PatchworkPreviewElement } from "./patchwork-preview";

const TAG = "patchwork-pipe";
const SKIP_TAGS = new Set(["div", "button"]);

function isLayoutChrome(el: Element): boolean {
  return (
    SKIP_TAGS.has(el.tagName.toLowerCase()) ||
    el.classList.contains("space-divider") ||
    el.classList.contains("space-drag-handle") ||
    el.classList.contains("space-add-pipe-btn")
  );
}

export class PatchworkPipeElement extends LitElement {
  static properties = {
    editing: { type: Boolean, reflect: true },
    transform: { type: String, reflect: true },
    expanded: { type: Boolean, reflect: true },
    _editorOpen: { state: true },
    _showPicker: { state: true },
  };

  declare editing: boolean;
  declare transform: string;
  declare expanded: boolean;
  declare _editorOpen: boolean;
  declare _showPicker: boolean;

  #input: any = undefined;
  #output: any = undefined;
  #loadedTransform: LoadedTransform | null = null;
  #cleanup: (() => void) | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #config: Record<string, unknown> = {};
  #previewIframe: HTMLIFrameElement | null = null;
  #retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.editing = false;
    this.transform = "";
    this.expanded = false;
    this._editorOpen = false;
    this._showPicker = false;
  }

  get input(): any {
    return this.#input;
  }

  set input(value: any) {
    this.#input = value;
    this.#runTransform();
  }

  get output(): any {
    return this.#output;
  }

  get config(): Record<string, unknown> {
    return { ...this.#config };
  }

  set config(value: Record<string, unknown>) {
    this.#config = { ...value };
    if (this.#input !== undefined) {
      this.#runTransform();
    }
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#applyDisplayStyles();
    this.#loadAndSetup();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#teardownPipe();
    if (this.#retryTimer) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = null;
    }
  }

  connectedMoveCallback() {}

  updated(changed: Map<string, unknown>) {
    this.#applyDisplayStyles();
    if (changed.has("transform")) {
      this.#teardownPipe();
      this.#loadAndSetup();
    }
    if (changed.has("editing") && !this.editing && this.transform) {
      this.#teardownPipe();
      this.#loadAndSetup();
    }
    if (changed.has("expanded")) {
      this.#syncExpandedPreview();
    }
  }

  #applyDisplayStyles() {
    if (this.expanded && this.transform) {
      this.style.display = "flex";
      this.style.flexDirection = "column";
      this.style.alignItems = "stretch";
      this.style.justifyContent = "stretch";
      this.style.flexShrink = "0";
      this.style.flex = "1 0 0px";
      this.style.minWidth = "0";
      this.style.minHeight = "0";
      this.style.cursor = "";
      this.style.width = "";
      this.style.height = "";
    } else if (this.editing) {
      this.style.display = "flex";
      this.style.flexDirection = "";
      this.style.alignItems = "center";
      this.style.justifyContent = "center";
      this.style.flexShrink = "0";
      this.style.flex = "";
      this.style.minWidth = "";
      this.style.minHeight = "";

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
    if (!this.editing && !this.expanded) return nothing;

    const hasTransform = !!this.transform;

    if (this.expanded && hasTransform) {
      return html`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 8px;background:color-mix(in oklch, currentColor 6%, Canvas);border-bottom:1px solid color-mix(in oklch, currentColor 10%, transparent);flex-shrink:0;font-size:11px;color:color-mix(in oklch, currentColor 60%, Canvas);">
          <span style="font-weight:600;">${this.transform}</span>
          <button
            style="border:none;background:none;cursor:pointer;font-size:14px;color:inherit;opacity:0.6;padding:2px 4px;"
            title="Collapse preview"
            @click=${() => { this.expanded = false; this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true })); }}
          >▾</button>
        </div>
      `;
    }

    if (!this.editing) return nothing;

    const indicatorText = hasTransform ? this.transform : "⊕";
    const indicatorTitle = hasTransform ? `Transform: ${this.transform}` : "Add transform";

    return html`
      <div style="display:flex;align-items:center;gap:4px;">
        <button
          class="pipe-indicator"
          title=${indicatorTitle}
          @click=${this.#toggleEditor}
        >${indicatorText}</button>
        ${hasTransform ? html`
          <button
            style="border:none;background:oklch(0.55 0.2 250 / 0.15);color:oklch(0.55 0.2 250);cursor:pointer;font-size:10px;padding:1px 5px;border-radius:4px;font-weight:600;"
            title="Expand preview"
            @click=${() => { this.expanded = true; this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true })); }}
          >▸</button>
        ` : nothing}
      </div>
      ${this._editorOpen ? this.#renderEditor() : nothing}
    `;
  }

  #toggleEditor = () => {
    this._editorOpen = !this._editorOpen;
    this._showPicker = false;
  };

  #renderEditor() {
    const registry = getTransformRegistry();
    const available = registry.all();

    return html`
      <div class="pipe-editor">
        <div class="pipe-editor-header">
          <span>Pipe transform</span>
          <button class="pipe-editor-close" @click=${() => { this._editorOpen = false; }}>×</button>
        </div>
        <div class="pipe-editor-body">
          ${this.transform
            ? html`
                <div class="pipe-editor-transform">
                  <span>${this.transform}</span>
                  <button class="pipe-editor-transform-remove" @click=${this.#removeTransform}>×</button>
                </div>
              `
            : html`<div class="pipe-editor-empty">No transform — data passes through unchanged</div>`
          }
          ${!this.transform
            ? (this._showPicker
                ? html`
                    <div class="pipe-editor-picker">
                      ${available.map((desc) => html`
                        <button class="pipe-editor-picker-item" @click=${() => this.#setTransform(desc.id)}>
                          ${desc.name}
                        </button>
                      `)}
                    </div>
                  `
                : html`
                    <button class="pipe-editor-add-btn" @click=${() => { this._showPicker = true; }}>
                      + Set transform
                    </button>
                  `)
            : nothing
          }
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

  #removeTransform = () => {
    this.transform = "";
    this.expanded = false;
    this.#loadedTransform = null;
    this.#teardownPipe();
    this.#removeExpandedPreview();
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true }));
  };

  #setTransform(id: string) {
    this.transform = id;
    this._showPicker = false;
    this.#teardownPipe();
    this.#loadAndSetup();
    this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true }));
  }

  #deletePipe = () => {
    this.dispatchEvent(new CustomEvent("pipe:delete", {
      detail: { id: this.id },
      bubbles: true,
    }));
    this.remove();
  };

  async #loadAndSetup() {
    if (!this.transform) return;

    try {
      const loaded = await loadTransform(this.transform);
      if (!loaded) {
        console.warn(`Transform "${this.transform}" not found in registry`);
        return;
      }
      this.#loadedTransform = loaded;
    } catch (e) {
      console.error(`Failed to load transform "${this.transform}":`, e);
      return;
    }

    this.#setupPipe();
  }

  async #runTransform() {
    if (!this.#loadedTransform || this.#input === undefined) return;

    try {
      const result = await this.#loadedTransform.module.run(this.#input, this.#config);
      this.#output = result;

      if (this.expanded && this.#previewIframe && typeof result === "string") {
        this.#previewIframe.removeAttribute("src");
        this.#previewIframe.srcdoc = result;
      }

      const target = this.#findTarget();
      if (target && result !== null) {
        target.value = result;
      }
    } catch (e) {
      console.error("Pipe transform error:", e);
    }
  }

  async #findSource(): Promise<{ handle: DocHandle<any>; view: PatchworkViewElement } | null> {
    let el: Element | null = this.previousElementSibling;
    while (el && (el.tagName.toLowerCase() === TAG || isLayoutChrome(el))) {
      el = el.previousElementSibling;
    }
    if (!el) return null;
    const view = el.tagName.toLowerCase() === "patchwork-view"
      ? (el as PatchworkViewElement)
      : (el.querySelector("patchwork-view") as PatchworkViewElement | null);
    if (!view?.docUrl || !view?.repo) return null;
    const handle = await (view.repo as any).find(view.docUrl) as DocHandle<any>;
    return handle ? { handle, view } : null;
  }

  #findTarget(): PatchworkPreviewElement | null {
    let el: Element | null = this.nextElementSibling;
    while (el && (el.tagName.toLowerCase() === TAG || isLayoutChrome(el))) {
      el = el.nextElementSibling;
    }
    if (!el) return null;
    if (el.tagName.toLowerCase() === "patchwork-preview") {
      return el as PatchworkPreviewElement;
    }
    return el.querySelector("patchwork-preview") as PatchworkPreviewElement | null;
  }

  #setupPipe(retryCount = 0) {
    this.#teardownPipe();
    if (!this.transform || !this.#loadedTransform) return;

    const delay = retryCount === 0 ? 100 : Math.min(500 * retryCount, 3000);

    const timer = setTimeout(async () => {
      const source = await this.#findSource();
      const target = this.expanded ? null : this.#findTarget();

      if (!source) {
        if (retryCount < 8) {
          this.#retryTimer = setTimeout(() => this.#setupPipe(retryCount + 1), delay);
        }
        return;
      }

      const needsExternalTarget = !this.expanded;
      if (needsExternalTarget && !target) {
        if (retryCount < 8) {
          this.#retryTimer = setTimeout(() => this.#setupPipe(retryCount + 1), delay);
        }
        return;
      }

      const runPipe = async () => {
        try {
          const doc = source.handle.doc();
          if (!doc) return;
          this.input = doc;
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
    }, retryCount === 0 ? 100 : 0);

    if (retryCount === 0) {
      this.#cleanup = () => clearTimeout(timer);
    }
  }

  #teardownPipe() {
    this.#cleanup?.();
    this.#cleanup = null;
    if (this.#retryTimer) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = null;
    }
  }

  #syncExpandedPreview() {
    if (this.expanded && this.transform) {
      if (!this.#previewIframe) {
        this.#previewIframe = document.createElement("iframe");
        this.#previewIframe.style.cssText =
          "width:100%;flex:1;border:none;background:Canvas;min-height:0;";
        this.#previewIframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      }
      if (!this.contains(this.#previewIframe)) {
        this.appendChild(this.#previewIframe);
      }
      if (this.#output && typeof this.#output === "string") {
        this.#previewIframe.removeAttribute("src");
        this.#previewIframe.srcdoc = this.#output;
      }
      this.#teardownPipe();
      this.#setupPipe();
    } else {
      this.#removeExpandedPreview();
    }
  }

  #removeExpandedPreview() {
    if (this.#previewIframe) {
      this.#previewIframe.remove();
      this.#previewIframe = null;
    }
  }
}

export function registerPatchworkPipe() {
  if (customElements.get(TAG)) return;
  customElements.define(TAG, PatchworkPipeElement);
}

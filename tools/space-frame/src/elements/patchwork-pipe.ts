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
const SPACE_TAG = "patchwork-space";

function isLayoutChrome(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return tag !== SPACE_TAG && tag !== TAG && tag !== "patchwork-view" && tag !== "patchwork-preview";
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

  get input(): any { return this.#input; }

  set input(value: any) {
    this.#input = value;
    this.#runTransform();
  }

  get output(): any { return this.#output; }

  get config(): Record<string, unknown> { return { ...this.#config }; }

  set config(value: Record<string, unknown>) {
    this.#config = { ...value };
    if (this.#input !== undefined) this.#runTransform();
  }

  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this.#applyStyles();
    this.addEventListener("pointerdown", this.#onPointerDown);
    if (this.transform) this.#loadAndSetup();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerdown", this.#onPointerDown);
    this.#teardownPipe();
    if (this.#retryTimer) { clearTimeout(this.#retryTimer); this.#retryTimer = null; }
  }

  #onPointerDown = (e: PointerEvent) => {
    if (!this.editing || this.expanded) return;
    if ((e.target as HTMLElement).closest(".pipe-center-btn, .pipe-editor")) return;
    this.handleResize(e);
  };

  connectedMoveCallback() {}

  updated(changed: Map<string, unknown>) {
    this.#applyStyles();
    if (changed.has("transform")) {
      this.#teardownPipe();
      if (this.transform) this.#loadAndSetup();
    }
    if (changed.has("editing") && !this.editing && this.transform) {
      this.#teardownPipe();
      this.#loadAndSetup();
    }
    if (changed.has("expanded")) {
      this.#syncExpandedPreview();
    }
  }

  // ---- Styles ----

  #applyStyles() {
    const parent = this.parentElement;
    const parentDir = parent?.getAttribute("direction");
    const isVertical = parentDir === "vertical";

    // Inherit depth color from parent space's children depth
    const parentDepth = parent?.tagName.toLowerCase() === SPACE_TAG
      ? parseInt(getComputedStyle(parent).getPropertyValue("--depth") || "0", 10)
      : 0;
    const childDepth = parentDepth + 1;
    const chroma = Math.min(0.15, Math.max(0, (childDepth - 1) * 0.15));
    const hue = 250 - Math.max(0, childDepth - 2) * 40;
    this.style.setProperty("--depth-color", `oklch(0.55 ${chroma} ${hue})`);

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
      this.style.position = "relative";

      if (isVertical) {
        this.style.height = "6px";
        this.style.width = "100%";
        this.style.cursor = "row-resize";
      } else {
        this.style.width = "6px";
        this.style.height = "100%";
        this.style.cursor = "col-resize";
      }
    } else {
      this.style.display = "none";
      this._editorOpen = false;
      this._showPicker = false;
    }
  }

  // ---- Render ----

  render() {
    if (!this.editing && !this.expanded) return nothing;

    const hasTransform = !!this.transform;

    if (this.expanded && hasTransform) {
      return html`
        <div class="pipe-expanded-header">
          <span>${this.transform}</span>
          <button
            class="pipe-expanded-collapse"
            title="Collapse preview"
            @click=${() => { this.expanded = false; this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true })); }}
          >▾</button>
        </div>
      `;
    }

    if (!this.editing) return nothing;

    return html`
      <button
        class="pipe-center-btn"
        title=${hasTransform ? this.transform : "Configure pipe"}
        @pointerdown=${(e: PointerEvent) => e.stopPropagation()}
        @click=${this.#toggleEditor}
      >${hasTransform ? "⟡" : "⊕"}</button>
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
    const hasTransform = !!this.transform;

    return html`
      <div class="pipe-editor" @pointerdown=${(e: Event) => e.stopPropagation()}>
        <div class="pipe-editor-header">
          <span>Pipe</span>
          <button class="pipe-editor-close" @click=${() => { this._editorOpen = false; }}>×</button>
        </div>
        <div class="pipe-editor-body">
          ${hasTransform
            ? html`
                <div class="pipe-editor-transform">
                  <span>${this.transform}</span>
                  <button class="pipe-editor-transform-remove" @click=${this.#removeTransform}>×</button>
                </div>
                <button
                  class="pipe-editor-add-btn"
                  @click=${() => { this.expanded = true; this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true })); }}
                >▸ Expand preview</button>
              `
            : html`<div class="pipe-editor-empty">No transform set</div>`
          }
          ${!hasTransform
            ? (this._showPicker
                ? html`
                    <div class="pipe-editor-picker">
                      ${available.map((desc) => html`
                        <button class="pipe-editor-picker-item" @click=${() => this.#setTransform(desc.id)}>
                          ${desc.name}
                        </button>
                      `)}
                      ${available.length === 0
                        ? html`<div class="pipe-editor-empty">No transforms available</div>`
                        : nothing
                      }
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
      </div>
    `;
  }

  // ---- Transform management ----

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

  // ---- Resize (this element IS the divider) ----

  handleResize(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const parent = this.parentElement;
    if (!parent) return;

    this.setPointerCapture(e.pointerId);

    const isVert = parent.getAttribute("direction") === "vertical";
    const startPos = isVert ? e.clientY : e.clientX;

    const beforeEl = this.#findAdjacentSpace("before");
    const afterEl = this.#findAdjacentSpace("after");
    if (!beforeEl || !afterEl) return;

    const allSpaces = Array.from(
      parent.querySelectorAll(`:scope > ${SPACE_TAG}`)
    ) as HTMLElement[];

    const snapshots = new Map<HTMLElement, number>();
    for (const child of allSpaces) {
      const r = child.getBoundingClientRect();
      snapshots.set(child, isVert ? r.height : r.width);
    }

    const startBefore = snapshots.get(beforeEl)!;
    const startAfter = snapshots.get(afterEl)!;

    for (const [child, size] of snapshots) {
      child.style.flex = `0 0 ${size}px`;
    }

    const onMove = (ev: PointerEvent) => {
      const delta = (isVert ? ev.clientY : ev.clientX) - startPos;
      beforeEl.style.flex = `0 0 ${Math.max(30, startBefore + delta)}px`;
      afterEl.style.flex = `0 0 ${Math.max(30, startAfter - delta)}px`;
    };

    const onUp = () => {
      this.removeEventListener("pointermove", onMove);
      this.removeEventListener("pointerup", onUp);
      this.removeEventListener("lostpointercapture", onUp);

      let total = 0;
      const sizes: number[] = [];
      for (const child of allSpaces) {
        const r = child.getBoundingClientRect();
        const s = isVert ? r.height : r.width;
        sizes.push(s);
        total += s;
      }
      if (total > 0) {
        for (let i = 0; i < allSpaces.length; i++) {
          allSpaces[i].style.flex = `${sizes[i] / total} 0 0px`;
        }
      }

      this.dispatchEvent(new CustomEvent("space:resize", { bubbles: true }));
    };

    this.addEventListener("pointermove", onMove);
    this.addEventListener("pointerup", onUp);
    this.addEventListener("lostpointercapture", onUp);
  }

  #findAdjacentSpace(direction: "before" | "after"): HTMLElement | null {
    let el: Element | null = direction === "before"
      ? this.previousElementSibling
      : this.nextElementSibling;
    while (el && el.tagName.toLowerCase() !== SPACE_TAG) {
      el = direction === "before" ? el.previousElementSibling : el.nextElementSibling;
    }
    return el as HTMLElement | null;
  }

  // ---- Data pipe ----

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

      if (!this.expanded && !target) {
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
    if (this.#retryTimer) { clearTimeout(this.#retryTimer); this.#retryTimer = null; }
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

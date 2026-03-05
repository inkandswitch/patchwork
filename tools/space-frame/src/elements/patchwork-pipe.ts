import type { DocHandle } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import { runTransformChain, getAvailableTransforms } from "../pipes/transforms/registry";
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements";
import type { PatchworkPreviewElement } from "./patchwork-preview";

import "../pipes/transforms/latex-to-html";
import "../pipes/transforms/passthrough";

const TAG = "patchwork-pipe";

export class PatchworkPipeElement extends HTMLElement {
  static observedAttributes = ["editing"];

  #cleanup: (() => void) | null = null;
  #indicator: HTMLElement | null = null;
  #editorEl: HTMLElement | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  get editing(): boolean {
    return this.hasAttribute("editing");
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
    this.#updateDisplay();
    this.#setupPipe();
  }

  disconnectedCallback() {
    this.#teardownPipe();
    this.#indicator?.remove();
    this.#indicator = null;
    this.#editorEl?.remove();
    this.#editorEl = null;
  }

  attributeChangedCallback() {
    this.#updateDisplay();
  }

  connectedMoveCallback() {
    // Preserve state during moveBefore
  }

  #updateDisplay() {
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
      this.#showIndicator();
    } else {
      this.style.display = "none";
      this.#indicator?.remove();
      this.#indicator = null;
      this.#editorEl?.remove();
      this.#editorEl = null;
    }
  }

  #showIndicator() {
    if (!this.#indicator) {
      this.#indicator = document.createElement("button");
      this.#indicator.className = "pipe-indicator";
      this.#indicator.addEventListener("click", (e) => {
        e.stopPropagation();
        this.#toggleEditor();
      });
    }
    const t = this.transforms;
    this.#indicator.textContent = t.length > 0 ? t.join(" → ") : "⊕";
    this.#indicator.title = t.length > 0 ? "Edit pipe" : "Configure pipe";
    if (!this.#indicator.parentElement) {
      this.appendChild(this.#indicator);
    }
  }

  #toggleEditor() {
    if (this.#editorEl) {
      this.#editorEl.remove();
      this.#editorEl = null;
      return;
    }
    this.#editorEl = document.createElement("div");
    this.#editorEl.className = "pipe-editor";
    this.#renderEditor();
    this.appendChild(this.#editorEl);
  }

  #renderEditor() {
    const el = this.#editorEl;
    if (!el) return;
    el.innerHTML = "";

    const header = document.createElement("div");
    header.className = "pipe-editor-header";
    header.innerHTML = `<span>Pipe transforms</span>`;
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.className = "pipe-editor-close";
    closeBtn.addEventListener("click", () => {
      this.#editorEl?.remove();
      this.#editorEl = null;
    });
    header.appendChild(closeBtn);
    el.appendChild(header);

    const body = document.createElement("div");
    body.className = "pipe-editor-body";

    const current = this.transforms;
    if (current.length === 0) {
      const empty = document.createElement("div");
      empty.className = "pipe-editor-empty";
      empty.textContent = "No transforms — data passes through unchanged";
      body.appendChild(empty);
    } else {
      for (const t of current) {
        const row = document.createElement("div");
        row.className = "pipe-editor-transform";
        const label = document.createElement("span");
        label.textContent = t;
        row.appendChild(label);
        const removeBtn = document.createElement("button");
        removeBtn.className = "pipe-editor-transform-remove";
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
          this.transforms = current.filter((x) => x !== t);
          this.#renderEditor();
          this.#showIndicator();
          this.#teardownPipe();
          this.#setupPipe();
          this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true }));
        });
        row.appendChild(removeBtn);
        body.appendChild(row);
      }
    }

    const addBtn = document.createElement("button");
    addBtn.className = "pipe-editor-add-btn";
    addBtn.textContent = "+ Add transform";
    addBtn.addEventListener("click", () => {
      addBtn.remove();
      const picker = document.createElement("div");
      picker.className = "pipe-editor-picker";
      for (const desc of getAvailableTransforms()) {
        const opt = document.createElement("button");
        opt.className = "pipe-editor-picker-item";
        opt.textContent = desc.name;
        opt.addEventListener("click", () => {
          this.transforms = [...this.transforms, desc.type];
          this.#renderEditor();
          this.#showIndicator();
          this.#teardownPipe();
          this.#setupPipe();
          this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true }));
        });
        picker.appendChild(opt);
      }
      body.appendChild(picker);
    });
    body.appendChild(addBtn);
    el.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "pipe-editor-actions";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "pipe-editor-action-btn pipe-editor-action-btn--danger";
    deleteBtn.textContent = "Delete pipe";
    deleteBtn.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("pipe:delete", {
        detail: { id: this.id },
        bubbles: true,
      }));
      this.remove();
    });
    actions.appendChild(deleteBtn);
    el.appendChild(actions);
  }

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

    // Delay to let DOM settle
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

import { _ as __vitePreload } from "./index-C2Ff-Tea.js";
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
const createSVGElement = ([tag, attrs, children]) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs).forEach((name) => {
    element.setAttribute(name, String(attrs[name]));
  });
  if (children?.length) {
    children.forEach((child) => {
      const childElement = createSVGElement(child);
      element.appendChild(childElement);
    });
  }
  return element;
};
const createElement = (iconNode, customAttrs = {}) => {
  const tag = "svg";
  const attrs = {
    ...defaultAttributes,
    ...customAttrs
  };
  return createSVGElement([tag, attrs, iconNode]);
};
const GripHorizontal = [
  ["circle", { cx: "12", cy: "9", r: "1" }],
  ["circle", { cx: "19", cy: "9", r: "1" }],
  ["circle", { cx: "5", cy: "9", r: "1" }],
  ["circle", { cx: "12", cy: "15", r: "1" }],
  ["circle", { cx: "19", cy: "15", r: "1" }],
  ["circle", { cx: "5", cy: "15", r: "1" }]
];
const X = [
  ["path", { d: "M18 6 6 18" }],
  ["path", { d: "m6 6 12 12" }]
];
const TAG$1 = "patchwork-space";
function canMoveBefore() {
  return typeof Element.prototype.moveBefore === "function";
}
function createIcon(iconData, size = 14) {
  return createElement(iconData, { width: size, height: size });
}
class PatchworkSpaceElement extends HTMLElement {
  static observedAttributes = ["direction", "editing"];
  #dragHandle = null;
  #removeBtn = null;
  #dividers = [];
  #childObserver = null;
  #abortController = null;
  #updatingUI = false;
  get direction() {
    return this.getAttribute("direction") || "horizontal";
  }
  get editing() {
    return this.hasAttribute("editing");
  }
  get isLeaf() {
    return !this.querySelector(`:scope > ${TAG$1}`);
  }
  get depth() {
    let d = 0;
    let el = this.parentElement;
    while (el) {
      if (el.tagName.toLowerCase() === TAG$1) d++;
      el = el.parentElement;
    }
    return d;
  }
  connectedCallback() {
    this.#applyLayout();
    this.#childObserver = new MutationObserver(() => {
      if (this.#updatingUI) return;
      this.#applyLayout();
    });
    this.#childObserver.observe(this, { childList: true });
  }
  disconnectedCallback() {
    this.#childObserver?.disconnect();
    this.#childObserver = null;
    this.#teardownEditUI();
  }
  attributeChangedCallback() {
    this.#applyLayout();
    this.#updateEditUI();
    this.#cascadeEditing();
  }
  connectedMoveCallback() {
  }
  #applyLayout() {
    this.style.display = "flex";
    this.style.flexDirection = this.direction === "vertical" ? "column" : "row";
    this.style.position = "relative";
    this.style.minWidth = "0";
    this.style.minHeight = "0";
    this.style.setProperty("--depth", String(this.depth));
    if (this.editing && !this.isLeaf) {
      this.style.overflow = "visible";
    } else {
      this.style.overflow = "hidden";
    }
  }
  #cascadeEditing() {
    const isEdit = this.editing;
    for (const child of this.children) {
      const tag = child.tagName.toLowerCase();
      if (tag === TAG$1 || tag === "patchwork-pipe") {
        if (isEdit) {
          child.setAttribute("editing", "");
        } else {
          child.removeAttribute("editing");
        }
      }
    }
  }
  #updateEditUI() {
    this.#updatingUI = true;
    try {
      if (this.editing) {
        if (this.isLeaf) {
          this.#showLeafControls();
          this.#removeDividers();
        } else {
          this.#hideLeafControls();
          this.#createDividers();
        }
      } else {
        this.#hideLeafControls();
        this.#removeDividers();
      }
    } finally {
      this.#updatingUI = false;
    }
  }
  // ---- Leaf edit controls ----
  #showLeafControls() {
    if (!this.#dragHandle) {
      this.#dragHandle = document.createElement("div");
      this.#dragHandle.className = "space-drag-handle";
      const grip = createIcon(GripHorizontal, 14);
      grip.style.flexShrink = "0";
      this.#dragHandle.appendChild(grip);
      this.#removeBtn = document.createElement("button");
      this.#removeBtn.className = "space-handle-close";
      this.#removeBtn.appendChild(createIcon(X, 10));
      this.#removeBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
      this.#removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent("space:remove", {
          detail: { id: this.id },
          bubbles: true
        }));
      });
      this.#dragHandle.appendChild(this.#removeBtn);
      this.#dragHandle.addEventListener("pointerdown", this.#onDragStart);
      this.#dragHandle.addEventListener("dragstart", (e) => e.preventDefault());
    }
    if (!this.#dragHandle.parentElement) {
      this.appendChild(this.#dragHandle);
    }
  }
  #hideLeafControls() {
    this.#dragHandle?.remove();
  }
  // ---- Drag reorder ----
  #onDragStart = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const container = this.parentElement;
    if (!container || container.children.length < 2) return;
    this.setAttribute("aria-grabbed", "true");
    const rect = this.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;
    const onMove = (ev) => {
      this.style.setProperty("--drag-x", "0px");
      this.style.setProperty("--drag-y", "0px");
      const r = this.getBoundingClientRect();
      const targetX = ev.clientX - (r.left + offsetX);
      const targetY = ev.clientY - (r.top + offsetY);
      this.style.setProperty("--drag-x", `${targetX}px`);
      this.style.setProperty("--drag-y", `${targetY}px`);
      this.style.pointerEvents = "none";
      const elementBelow = document.elementFromPoint(ev.clientX, ev.clientY);
      this.style.pointerEvents = "";
      let targetSibling = elementBelow;
      while (targetSibling && targetSibling.parentElement !== container) {
        targetSibling = targetSibling.parentElement;
      }
      for (const el of container.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      if (targetSibling && targetSibling !== this && targetSibling.parentElement === container && targetSibling.tagName.toLowerCase() === TAG$1) {
        const siblings = Array.from(container.children);
        const currentIndex = siblings.indexOf(this);
        const targetIndex = siblings.indexOf(targetSibling);
        const siblingRect = targetSibling.getBoundingClientRect();
        const isHorizontal = container.direction !== "vertical";
        const mid = isHorizontal ? siblingRect.left + siblingRect.width / 2 : siblingRect.top + siblingRect.height / 2;
        const pos = isHorizontal ? ev.clientX : ev.clientY;
        const shouldMoveBefore = pos < mid;
        const insertIndex = shouldMoveBefore ? targetIndex : targetIndex + 1;
        targetSibling.classList.add("drop-target");
        if (insertIndex !== currentIndex && insertIndex !== currentIndex + 1) {
          const refNode = insertIndex >= siblings.length ? null : siblings[insertIndex];
          if (canMoveBefore()) {
            container.moveBefore(this, refNode);
          } else {
            container.insertBefore(this, refNode);
          }
          this.style.setProperty("--drag-x", "0px");
          this.style.setProperty("--drag-y", "0px");
          const newRect = this.getBoundingClientRect();
          const newX = ev.clientX - (newRect.left + offsetX);
          const newY = ev.clientY - (newRect.top + offsetY);
          this.style.setProperty("--drag-x", `${newX}px`);
          this.style.setProperty("--drag-y", `${newY}px`);
        }
      }
    };
    const onUp = () => {
      this.removeAttribute("aria-grabbed");
      this.style.removeProperty("--drag-x");
      this.style.removeProperty("--drag-y");
      this.#abortController?.abort();
      this.#abortController = null;
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      this.dispatchEvent(new CustomEvent("space:reorder", {
        bubbles: true
      }));
    };
    document.addEventListener("pointermove", onMove, { signal });
    document.addEventListener("pointerup", onUp, { signal });
  };
  // ---- Resize dividers ----
  #getSpaceChildren() {
    return Array.from(this.querySelectorAll(`:scope > ${TAG$1}`));
  }
  #createDividers() {
    this.#removeDividers();
    const spaceChildren = this.#getSpaceChildren();
    if (spaceChildren.length < 2) return;
    const childDepth = this.depth + 1;
    const chroma = Math.min(0.15, Math.max(0, (childDepth - 1) * 0.15));
    const hue = 250 - Math.max(0, childDepth - 2) * 40;
    const depthColor = `oklch(0.55 ${chroma} ${hue})`;
    for (let i = 0; i < spaceChildren.length - 1; i++) {
      const divider = document.createElement("div");
      divider.className = `space-divider space-divider-${this.direction === "vertical" ? "horizontal" : "vertical"}`;
      divider.dataset.afterIndex = String(i);
      divider.style.setProperty("--depth-color", depthColor);
      const beforeEl = spaceChildren[i];
      const afterEl = spaceChildren[i + 1];
      divider.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        this.#onResizeStart(e, divider, beforeEl, afterEl);
      });
      beforeEl.after(divider);
      this.#dividers.push(divider);
    }
  }
  #removeDividers() {
    for (const d of this.#dividers) d.remove();
    this.#dividers = [];
  }
  #onResizeStart(e, divider, beforeEl, afterEl) {
    divider.setPointerCapture(e.pointerId);
    const isVertical = this.direction === "vertical";
    const startPos = isVertical ? e.clientY : e.clientX;
    const allChildren = this.#getSpaceChildren();
    const snapshots = /* @__PURE__ */ new Map();
    for (const child of allChildren) {
      const rect = child.getBoundingClientRect();
      snapshots.set(child, isVertical ? rect.height : rect.width);
    }
    const startBefore = snapshots.get(beforeEl);
    const startAfter = snapshots.get(afterEl);
    for (const [child, size] of snapshots) {
      child.style.flex = `0 0 ${size}px`;
    }
    const onMove = (ev) => {
      const delta = (isVertical ? ev.clientY : ev.clientX) - startPos;
      const newBefore = Math.max(30, startBefore + delta);
      const newAfter = Math.max(30, startAfter - delta);
      beforeEl.style.flex = `0 0 ${newBefore}px`;
      afterEl.style.flex = `0 0 ${newAfter}px`;
    };
    const onUp = () => {
      divider.removeEventListener("pointermove", onMove);
      divider.removeEventListener("pointerup", onUp);
      divider.removeEventListener("lostpointercapture", onUp);
      let totalSize = 0;
      const finalSizes = [];
      for (const child of allChildren) {
        const rect = child.getBoundingClientRect();
        const s = isVertical ? rect.height : rect.width;
        finalSizes.push(s);
        totalSize += s;
      }
      if (totalSize > 0) {
        for (let i = 0; i < allChildren.length; i++) {
          allChildren[i].style.flex = `${finalSizes[i] / totalSize} 0 0px`;
        }
      }
      this.dispatchEvent(new CustomEvent("space:resize", { bubbles: true }));
    };
    divider.addEventListener("pointermove", onMove);
    divider.addEventListener("pointerup", onUp);
    divider.addEventListener("lostpointercapture", onUp);
  }
  refreshEditUI() {
    this.#updateEditUI();
  }
  #teardownEditUI() {
    this.#hideLeafControls();
    this.#removeDividers();
    this.#abortController?.abort();
    this.#abortController = null;
  }
}
function registerPatchworkSpace() {
  if (customElements.get(TAG$1)) return;
  customElements.define(TAG$1, PatchworkSpaceElement);
}
const ELEMENT_NAME = "patchwork-preview";
class PatchworkPreviewElement extends HTMLElement {
  #iframe = null;
  #currentBlobUrl = null;
  get value() {
    return null;
  }
  set value(v) {
    if (!this.#iframe) return;
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#currentBlobUrl = null;
    }
    if (v === null) {
      this.#iframe.removeAttribute("src");
      this.#iframe.removeAttribute("srcdoc");
      return;
    }
    if (typeof v === "string") {
      this.#iframe.removeAttribute("src");
      this.#iframe.srcdoc = v;
    } else if (v instanceof Blob) {
      this.#iframe.removeAttribute("srcdoc");
      this.#currentBlobUrl = URL.createObjectURL(v);
      this.#iframe.src = this.#currentBlobUrl;
    }
  }
  connectedCallback() {
    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.overflow = "hidden";
    this.#iframe = document.createElement("iframe");
    this.#iframe.style.cssText = "width:100%;height:100%;border:none;background:#fff;";
    this.#iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.appendChild(this.#iframe);
  }
  disconnectedCallback() {
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#currentBlobUrl = null;
    }
    this.#iframe = null;
  }
}
function registerPatchworkPreviewElement() {
  if (customElements.get(ELEMENT_NAME)) return;
  customElements.define(ELEMENT_NAME, PatchworkPreviewElement);
}
const transforms = /* @__PURE__ */ new Map();
function registerTransform(descriptor) {
  transforms.set(descriptor.type, descriptor);
  if (descriptor.url) {
    transforms.set(descriptor.url, descriptor);
  }
}
function getAvailableTransforms() {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const desc of transforms.values()) {
    if (!seen.has(desc.type)) {
      seen.add(desc.type);
      result.push(desc);
    }
  }
  return result;
}
async function runTransformChain(types, doc) {
  let value = doc;
  for (const type of types) {
    const transform = transforms.get(type);
    if (!transform) {
      console.warn(`Transform "${type}" not found, skipping`);
      continue;
    }
    value = await transform.run(value);
  }
  return value;
}
const LATEXJS_BASE_URL = "https://cdn.jsdelivr.net/npm/latex.js/dist/";
let cachedModule = null;
async function loadLatexJs() {
  if (cachedModule) return cachedModule;
  cachedModule = await __vitePreload(() => import(
    /* @vite-ignore */
    "https://cdn.jsdelivr.net/npm/latex.js/dist/latex.mjs"
  ), true ? [] : void 0, import.meta.url);
  return cachedModule;
}
registerTransform({
  type: "latex-to-html",
  name: "LaTeX → HTML",
  description: "Renders LaTeX source to HTML using latex.js",
  async run(doc) {
    const content = typeof doc === "string" ? doc : doc?.content;
    if (!content || typeof content !== "string") {
      return "<html><body><p>No LaTeX content</p></body></html>";
    }
    try {
      const mod = await loadLatexJs();
      const generator = new mod.HtmlGenerator({ hyphenate: false });
      const parsed = mod.parse(content, { generator });
      const htmlDoc = parsed.htmlDocument(LATEXJS_BASE_URL);
      return "<!DOCTYPE html>\n" + htmlDoc.documentElement.outerHTML;
    } catch (e) {
      const msg = e.location ? `Line ${e.location.start.line}, Col ${e.location.start.column}: ${e.message}` : e.message || "Failed to render LaTeX";
      return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:20px;color:#ef4444;"><h3>LaTeX Error</h3><pre>${msg}</pre></body></html>`;
    }
  }
});
registerTransform({
  type: "passthrough",
  name: "Passthrough",
  description: "Passes data through unchanged",
  run(doc) {
    if (typeof doc === "string") return doc;
    if (doc?.content && typeof doc.content === "string") return doc.content;
    return JSON.stringify(doc, null, 2);
  }
});
const TAG = "patchwork-pipe";
class PatchworkPipeElement extends HTMLElement {
  static observedAttributes = ["editing"];
  #cleanup = null;
  #indicator = null;
  #editorEl = null;
  #debounceTimer = null;
  get editing() {
    return this.hasAttribute("editing");
  }
  get transforms() {
    const attr = this.getAttribute("transforms");
    if (!attr) return [];
    return attr.split(",").map((s) => s.trim()).filter(Boolean);
  }
  set transforms(list) {
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
        bubbles: true
      }));
      this.remove();
    });
    actions.appendChild(deleteBtn);
    el.appendChild(actions);
  }
  // ---- Pipe execution ----
  #findSource() {
    let el = this.previousElementSibling;
    while (el && el.tagName.toLowerCase() === TAG) {
      el = el.previousElementSibling;
    }
    if (!el) return null;
    const view = el.tagName.toLowerCase() === "patchwork-view" ? el : el.querySelector("patchwork-view");
    if (!view?.docUrl || !view?.repo) return null;
    const handle = view.repo.find(view.docUrl);
    return handle ? { handle, view } : null;
  }
  #findTarget() {
    let el = this.nextElementSibling;
    while (el && el.tagName.toLowerCase() === TAG) {
      el = el.nextElementSibling;
    }
    if (!el) return null;
    if (el.tagName.toLowerCase() === "patchwork-preview") {
      return el;
    }
    return el.querySelector("patchwork-preview");
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
function registerPatchworkPipe() {
  if (customElements.get(TAG)) return;
  customElements.define(TAG, PatchworkPipeElement);
}
const STORAGE_PREFIX = "patchwork-space-layout:";
function loadLayout(accountUrl) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${accountUrl}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.root?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
function saveLayout(accountUrl, layout) {
  localStorage.setItem(`${STORAGE_PREFIX}${accountUrl}`, JSON.stringify(layout));
}
function clearLayout(accountUrl) {
  localStorage.removeItem(`${STORAGE_PREFIX}${accountUrl}`);
}
function createDefaultLayout(accountDocUrl, config) {
  const sidebar = {
    id: "sidebar",
    size: 17,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.accountSidebarToolId,
      docUrl: accountDocUrl
    }
  };
  const toolbar = {
    id: "toolbar",
    fixedSize: 40,
    content: {
      type: "view",
      toolId: "document-toolbar-group"
    }
  };
  const main = {
    id: "main",
    content: { type: "view" }
  };
  const center = {
    id: "center",
    direction: "vertical",
    children: [toolbar, main]
  };
  const context = {
    id: "context",
    size: 17,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.contextSidebarToolId,
      docUrl: accountDocUrl
    }
  };
  const root = {
    id: "root",
    direction: "horizontal",
    children: [sidebar, center, context]
  };
  return { root };
}
function isPipeNode(child) {
  return "type" in child && child.type === "pipe";
}
function mountSpaceFrame(handle, element, repo) {
  registerPatchworkSpace();
  registerPatchworkPreviewElement();
  registerPatchworkPipe();
  const accountDocUrl = handle.url;
  let layout = null;
  let rootEl = null;
  let editing = false;
  let selectedDoc = null;
  let overlay = null;
  function init() {
    const doc = handle.doc();
    if (!doc) {
      handle.once("change", init);
      return;
    }
    const existing = loadLayout(accountDocUrl);
    if (existing) {
      layout = existing;
    } else {
      layout = createDefaultLayout(accountDocUrl, doc);
      saveLayout(accountDocUrl, layout);
    }
    buildTree();
    setupListeners();
  }
  function buildTree() {
    if (!layout) return;
    element.innerHTML = "";
    rootEl = buildNode(layout.root);
    rootEl.id = "space-root";
    element.appendChild(rootEl);
    createOverlay();
  }
  function buildNode(node) {
    const el = document.createElement("patchwork-space");
    el.id = `space-${node.id}`;
    el.dataset.spaceId = node.id;
    if (node.direction) {
      el.setAttribute("direction", node.direction);
    }
    if (node.fixedSize != null) {
      el.style.flex = `0 0 ${node.fixedSize}px`;
    } else if (node.size != null) {
      el.style.flex = `${node.size} 0 0px`;
    } else {
      el.style.flex = "1 0 0px";
    }
    if (node.children) {
      for (const child of node.children) {
        if (isPipeNode(child)) {
          const pipeEl = buildPipeNode(child);
          el.appendChild(pipeEl);
        } else {
          el.appendChild(buildNode(child));
        }
      }
    } else if (node.content) {
      buildContent(el, node);
    }
    return el;
  }
  function buildPipeNode(pipe) {
    const el = document.createElement("patchwork-pipe");
    el.id = `pipe-${pipe.id}`;
    if (pipe.transforms.length > 0) {
      el.setAttribute("transforms", pipe.transforms.join(","));
    }
    return el;
  }
  function buildContent(container, node) {
    if (!node.content) return;
    if (node.content.type === "preview") {
      const preview = document.createElement("patchwork-preview");
      preview.style.width = "100%";
      preview.style.height = "100%";
      container.appendChild(preview);
      return;
    }
    if (node.content.type === "view") {
      const isMainView = !node.content.toolId && !node.content.docUrl;
      if (isMainView) {
        container.dataset.mainView = "true";
        if (selectedDoc) {
          appendView(container, selectedDoc.url, selectedDoc.toolId);
        } else {
          const placeholder = document.createElement("div");
          placeholder.className = "space-empty-state";
          placeholder.textContent = "Select a document in the sidebar";
          container.appendChild(placeholder);
        }
        return;
      }
      if (node.content.toolId === "document-toolbar-group") {
        container.dataset.toolbar = "true";
        if (selectedDoc) {
          buildToolbar(container, selectedDoc.url);
        }
        return;
      }
      const docUrl = node.content.docUrl ? node.content.docUrl : accountDocUrl;
      appendView(container, docUrl, node.content.toolId);
    }
  }
  function appendView(container, docUrl, toolId) {
    const view = document.createElement("patchwork-view");
    view.setAttribute("doc-url", docUrl);
    if (toolId) view.setAttribute("tool-id", toolId);
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.display = "block";
    container.appendChild(view);
  }
  function buildToolbar(container, docUrl) {
    const doc = handle.doc();
    if (!doc) return;
    const bar = document.createElement("div");
    bar.className = "space-toolbar";
    for (const tid of doc.documentToolbarToolIds ?? []) {
      const view = document.createElement("patchwork-view");
      view.setAttribute("doc-url", docUrl);
      view.setAttribute("tool-id", tid);
      view.className = "space-toolbar-item";
      bar.appendChild(view);
    }
    container.appendChild(bar);
  }
  function updateSelectedDoc(url, toolId) {
    if (selectedDoc?.url === url && selectedDoc?.toolId === toolId) return;
    selectedDoc = { url, toolId };
    if (!rootEl) return;
    const mainView = rootEl.querySelector("[data-main-view]");
    if (mainView) {
      mainView.innerHTML = "";
      appendView(mainView, url, toolId);
    }
    const toolbar = rootEl.querySelector("[data-toolbar]");
    if (toolbar) {
      toolbar.innerHTML = "";
      buildToolbar(toolbar, url);
    }
  }
  function toggleEditing() {
    editing = !editing;
    if (!rootEl) return;
    if (editing) {
      rootEl.setAttribute("editing", "");
    } else {
      rootEl.removeAttribute("editing");
    }
    updateOverlay();
  }
  function serializeTree() {
    if (!rootEl) return null;
    const root = serializeNode(rootEl);
    return root ? { root } : null;
  }
  function serializeNode(el) {
    const id = el.dataset.spaceId;
    if (!id) return null;
    const direction = el.getAttribute("direction");
    const node = { id };
    if (direction) node.direction = direction;
    const flexGrow = parseFloat(el.style.flexGrow);
    const flexBasis = el.style.flexBasis;
    if (flexGrow === 0 && flexBasis.endsWith("px") && parseFloat(flexBasis) > 0) {
      node.fixedSize = parseInt(flexBasis);
    } else if (flexGrow > 0 && flexGrow !== 1) {
      node.size = flexGrow;
    }
    const childSpaces = el.querySelectorAll(`:scope > patchwork-space`);
    el.querySelectorAll(`:scope > patchwork-pipe`);
    if (childSpaces.length > 0) {
      node.children = [];
      for (const child of el.children) {
        const tag = child.tagName.toLowerCase();
        if (tag === "patchwork-space") {
          const childNode = serializeNode(child);
          if (childNode) node.children.push(childNode);
        } else if (tag === "patchwork-pipe") {
          const pipeId = child.id?.replace("pipe-", "") || `pipe-${Date.now()}`;
          const transforms2 = (child.getAttribute("transforms") || "").split(",").map((s) => s.trim()).filter(Boolean);
          node.children.push({ id: pipeId, type: "pipe", transforms: transforms2 });
        }
      }
    } else {
      node.content = getContentForNode(id);
    }
    return node;
  }
  function getContentForNode(id) {
    if (!layout) return void 0;
    const found = findNodeById(layout.root, id);
    return found?.content;
  }
  function findNodeById(node, id) {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        if (isPipeNode(child)) continue;
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }
  function persistLayout() {
    const serialized = serializeTree();
    if (serialized) {
      layout = serialized;
      saveLayout(accountDocUrl, serialized);
    }
  }
  function resetLayout() {
    const doc = handle.doc();
    if (!doc) return;
    clearLayout(accountDocUrl);
    layout = createDefaultLayout(accountDocUrl, doc);
    saveLayout(accountDocUrl, layout);
    selectedDoc = null;
    buildTree();
    if (editing) {
      rootEl?.setAttribute("editing", "");
      updateOverlay();
    }
  }
  function createOverlay() {
    overlay?.remove();
    overlay = document.createElement("div");
    overlay.className = "edit-overlay";
    overlay.style.display = "none";
    element.appendChild(overlay);
  }
  function updateOverlay() {
    if (!overlay) return;
    if (editing) {
      overlay.style.display = "";
      overlay.innerHTML = "";
      const bar = document.createElement("div");
      bar.className = "edit-controls-bar";
      const addBtn = document.createElement("button");
      addBtn.className = "edit-ctrl-btn edit-ctrl-btn--add";
      addBtn.textContent = "+ Add";
      addBtn.addEventListener("click", () => addSpace());
      bar.appendChild(addBtn);
      const sep1 = document.createElement("div");
      sep1.className = "edit-ctrl-sep";
      bar.appendChild(sep1);
      const resetBtn = document.createElement("button");
      resetBtn.className = "edit-ctrl-btn";
      resetBtn.textContent = "Reset";
      resetBtn.addEventListener("click", resetLayout);
      bar.appendChild(resetBtn);
      const doneBtn = document.createElement("button");
      doneBtn.className = "edit-ctrl-btn edit-ctrl-btn--primary";
      doneBtn.textContent = "Done";
      doneBtn.addEventListener("click", () => toggleEditing());
      bar.appendChild(doneBtn);
      overlay.appendChild(bar);
    } else {
      overlay.style.display = "none";
    }
  }
  function addSpace() {
    if (!rootEl || !layout) return;
    const newId = `space-${Date.now()}`;
    const newNode = {
      id: newId,
      content: { type: "preview" }
    };
    const el = buildNode(newNode);
    rootEl.appendChild(el);
    if (editing) {
      el.setAttribute("editing", "");
    }
    persistLayout();
  }
  function refreshDividers() {
    if (!rootEl) return;
    const containers = rootEl.querySelectorAll("patchwork-space[editing]");
    for (const c of containers) {
      c.refreshEditUI?.();
    }
  }
  function setupListeners(doc) {
    element.addEventListener("patchwork:open-document", (event) => {
      const e = event;
      e.stopPropagation();
      updateSelectedDoc(e.detail.url, e.detail.toolId);
    });
    element.addEventListener("space:reorder", () => {
      persistLayout();
      refreshDividers();
    });
    element.addEventListener("space:resize", () => persistLayout());
    element.addEventListener("space:remove", ((e) => {
      const target = e.target;
      target.remove();
      persistLayout();
    }));
    element.addEventListener("pipe:update", () => persistLayout());
    element.addEventListener("pipe:delete", () => persistLayout());
    window.addEventListener("keydown", onKeyDown);
  }
  function onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "e") {
      e.preventDefault();
      toggleEditing();
    }
    if (e.key === "Escape" && editing) {
      toggleEditing();
    }
  }
  init();
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    overlay?.remove();
    rootEl?.remove();
  };
}
export {
  mountSpaceFrame
};
//# sourceMappingURL=space-frame-DidxyTdB.js.map

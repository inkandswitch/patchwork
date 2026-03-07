import { LitElement, nothing } from "lit";
import { createElement, GripHorizontal, X } from "lucide";

declare global {
  interface Element {
    moveBefore(child: Element, referenceChild: Element | null): void;
  }
}

const TAG = "patchwork-space";

if (typeof Element.prototype.moveBefore !== "function") {
  alert("This browser does not support moveBefore(). Please use Chrome or Firefox.");
}

function createIcon(iconData: typeof GripHorizontal, size = 14): SVGSVGElement {
  return createElement(iconData, { width: size, height: size }) as SVGSVGElement;
}

function findDropTarget(
  elementBelow: Element,
  draggedEl: Element,
  clientX: number,
  clientY: number
): { container: PatchworkSpaceElement | null; refChild: Element | null } {
  let candidate: Element | null = elementBelow;
  while (candidate) {
    if (candidate === draggedEl) {
      candidate = candidate.parentElement;
      continue;
    }
    if (candidate.tagName.toLowerCase() === TAG) {
      const isLeaf = !candidate.querySelector(`:scope > ${TAG}`);
      if (isLeaf) {
        candidate = candidate.parentElement;
        if (candidate === draggedEl) candidate = candidate?.parentElement ?? null;
      }
      break;
    }
    candidate = candidate.parentElement;
  }

  if (!candidate || candidate.tagName.toLowerCase() !== TAG) {
    return { container: null, refChild: null };
  }

  const container = candidate as PatchworkSpaceElement;
  const children = Array.from(container.querySelectorAll(`:scope > ${TAG}`))
    .filter((c) => c !== draggedEl);

  if (children.length === 0) {
    return { container, refChild: null };
  }

  const isHoriz = container.direction !== "vertical";
  let bestRef: Element | null = null;
  for (const child of children) {
    const r = child.getBoundingClientRect();
    const mid = isHoriz ? r.left + r.width / 2 : r.top + r.height / 2;
    const pos = isHoriz ? clientX : clientY;
    if (pos < mid) {
      bestRef = child;
      break;
    }
  }

  return { container, refChild: bestRef };
}

export class PatchworkSpaceElement extends LitElement {
  static properties = {
    direction: { reflect: true },
    editing: { type: Boolean, reflect: true },
  };

  // `declare` prevents TS from creating instance fields that shadow Lit's accessors
  declare direction: "horizontal" | "vertical";
  declare editing: boolean;

  #isDragging = false;
  #dragMoveHandler: ((ev: PointerEvent) => void) | null = null;
  #dragUpHandler: (() => void) | null = null;
  #dragHandleEl: HTMLElement | null = null;

  constructor() {
    super();
    this.direction = "horizontal";
    this.editing = false;
  }

  createRenderRoot() {
    return this;
  }

  get isLeaf(): boolean {
    return !this.querySelector(`:scope > ${TAG}`);
  }

  get depth(): number {
    let d = 0;
    let el: Element | null = this.parentElement;
    while (el) {
      if (el.tagName.toLowerCase() === TAG) d++;
      el = el.parentElement;
    }
    return d;
  }

  getSpaceChildren(): PatchworkSpaceElement[] {
    return Array.from(this.querySelectorAll(`:scope > ${TAG}`)) as PatchworkSpaceElement[];
  }

  // ---- Lifecycle ----

  connectedCallback() {
    super.connectedCallback();
    this.#applyLayoutStyles();
    if (this.editing) {
      this.#syncEditUI();
      this.#cascadeEditing();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  connectedMoveCallback() {
    this.#applyLayoutStyles();
    this.#syncEditUI();
  }

  updated(_changed: Map<string, unknown>) {
    this.#applyLayoutStyles();
    this.#syncEditUI();
    this.#cascadeEditing();
  }

  render() {
    return nothing;
  }

  // ---- Layout styles ----

  #applyLayoutStyles() {
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
    for (const child of Array.from(this.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === TAG || tag === "patchwork-pipe") {
        if (this.editing) {
          child.setAttribute("editing", "");
        } else {
          child.removeAttribute("editing");
        }
      }
    }
  }

  // ---- Edit UI ----

  #syncEditUI() {
    if (this.editing) {
      if (this.isLeaf) {
        this.#ensureDragHandle();
      } else {
        this.#removeDragHandle();
        this.#syncPipes();
      }
    } else {
      this.#removeDragHandle();
    }
  }

  refreshEditUI() {
    this.#applyLayoutStyles();
    this.#syncEditUI();
    this.#cascadeEditing();
  }

  // ---- Drag handle ----

  #ensureDragHandle() {
    if (!this.#dragHandleEl) {
      const handle = document.createElement("div");
      handle.className = "space-drag-handle";

      const grip = createIcon(GripHorizontal, 14);
      grip.style.flexShrink = "0";
      handle.appendChild(grip);

      const closeBtn = document.createElement("button");
      closeBtn.className = "space-handle-close";
      closeBtn.appendChild(createIcon(X, 12));
      closeBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dispatchEvent(
          new CustomEvent("space:remove", { detail: { id: this.id }, bubbles: true })
        );
      });
      handle.appendChild(closeBtn);

      handle.addEventListener("pointerdown", this.#onDragStart);
      handle.addEventListener("dragstart", (e) => e.preventDefault());
      this.#dragHandleEl = handle;
    }

    if (!this.contains(this.#dragHandleEl)) {
      this.appendChild(this.#dragHandleEl);
    }
  }

  #removeDragHandle() {
    this.#dragHandleEl?.remove();
  }

  // ---- Pipes (act as dividers between siblings) ----

  #isContentElement(el: Element): boolean {
    const tag = el.tagName.toLowerCase();
    if (tag === TAG) return true;
    if (tag === "patchwork-pipe" && el.hasAttribute("expanded")) return true;
    return false;
  }

  #isDividerPipe(el: Element): boolean {
    return el.tagName.toLowerCase() === "patchwork-pipe" && !el.hasAttribute("expanded");
  }

  #findDividerBetween(beforeEl: Element, afterEl: Element): HTMLElement | null {
    let sibling: Element | null = beforeEl.nextElementSibling;
    while (sibling && sibling !== afterEl) {
      if (this.#isDividerPipe(sibling)) return sibling as HTMLElement;
      sibling = sibling.nextElementSibling;
    }
    return null;
  }

  #syncPipes() {
    const contentChildren: Element[] = [];
    for (const child of Array.from(this.children)) {
      if (this.#isContentElement(child)) {
        contentChildren.push(child);
      }
    }

    if (contentChildren.length < 2) return;

    const usedDividers = new Set<Element>();

    for (let i = 0; i < contentChildren.length - 1; i++) {
      const beforeEl = contentChildren[i];
      const afterEl = contentChildren[i + 1];

      let pipe = this.#findDividerBetween(beforeEl, afterEl);
      if (!pipe) {
        pipe = document.createElement("patchwork-pipe");
        pipe.id = `pipe-${Date.now()}-${i}`;
        beforeEl.after(pipe);
      }

      usedDividers.add(pipe);

      if (this.editing) {
        pipe.setAttribute("editing", "");
      } else {
        pipe.removeAttribute("editing");
      }
    }

    for (const child of Array.from(this.children)) {
      if (this.#isDividerPipe(child) && !usedDividers.has(child) && !child.getAttribute("transform")) {
        child.remove();
      }
    }
  }

  // ---- Drag reorder (with cross-container reparenting) ----

  #cleanupDrag() {
    if (this.#dragMoveHandler) {
      document.removeEventListener("pointermove", this.#dragMoveHandler as any);
      this.#dragMoveHandler = null;
    }
    if (this.#dragUpHandler) {
      document.removeEventListener("pointerup", this.#dragUpHandler);
      this.#dragUpHandler = null;
    }
    this.#isDragging = false;
  }

  #onDragStart = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const originalParent = this.parentElement as PatchworkSpaceElement | null;
    if (!originalParent) return;

    this.#isDragging = true;
    this.setAttribute("aria-grabbed", "true");

    const rect = this.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const onMove = (ev: PointerEvent) => {
      this.style.setProperty("--drag-x", "0px");
      this.style.setProperty("--drag-y", "0px");
      const r = this.getBoundingClientRect();
      this.style.setProperty("--drag-x", `${ev.clientX - (r.left + offsetX)}px`);
      this.style.setProperty("--drag-y", `${ev.clientY - (r.top + offsetY)}px`);

      this.style.pointerEvents = "none";
      const elementBelow = document.elementFromPoint(ev.clientX, ev.clientY);
      this.style.pointerEvents = "";

      for (const el of Array.from(document.querySelectorAll(".drop-target"))) {
        el.classList.remove("drop-target");
      }

      if (!elementBelow) return;

      const { container, refChild } = findDropTarget(elementBelow, this, ev.clientX, ev.clientY);
      if (!container) return;

      container.classList.add("drop-target");

      const currentParent = this.parentElement;
      const siblings = Array.from(container.children);
      const myIdx = currentParent === container ? siblings.indexOf(this) : -1;
      const refIdx = refChild ? siblings.indexOf(refChild) : siblings.length;
      if (myIdx >= 0 && (refIdx === myIdx || refIdx === myIdx + 1)) return;

      container.moveBefore(this, refChild);

      this.style.setProperty("--drag-x", "0px");
      this.style.setProperty("--drag-y", "0px");
      const nr = this.getBoundingClientRect();
      this.style.setProperty("--drag-x", `${ev.clientX - (nr.left + offsetX)}px`);
      this.style.setProperty("--drag-y", `${ev.clientY - (nr.top + offsetY)}px`);
    };

    const onUp = () => {
      this.removeAttribute("aria-grabbed");
      this.style.removeProperty("--drag-x");
      this.style.removeProperty("--drag-y");

      this.#cleanupDrag();

      for (const el of Array.from(document.querySelectorAll(".drop-target"))) {
        el.classList.remove("drop-target");
      }

      const newParent = this.parentElement as PatchworkSpaceElement | null;
      if (originalParent !== newParent) {
        originalParent.refreshEditUI();
      }
      if (newParent) {
        newParent.refreshEditUI();
      }

      this.dispatchEvent(new CustomEvent("space:reorder", { bubbles: true }));
    };

    this.#dragMoveHandler = onMove;
    this.#dragUpHandler = onUp;
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

}

export function registerPatchworkSpace() {
  if (customElements.get(TAG)) return;
  customElements.define(TAG, PatchworkSpaceElement);
}

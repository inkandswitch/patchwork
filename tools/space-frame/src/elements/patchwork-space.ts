import { createElement, GripHorizontal, X } from "lucide";

declare global {
  interface Element {
    moveBefore?(child: Element, referenceChild: Element | null): void;
  }
}

const TAG = "patchwork-space";

function canMoveBefore(): boolean {
  return typeof Element.prototype.moveBefore === "function";
}

function createIcon(iconData: typeof GripHorizontal, size = 14): SVGSVGElement {
  return createElement(iconData, { width: size, height: size }) as SVGSVGElement;
}

export class PatchworkSpaceElement extends HTMLElement {
  static observedAttributes = ["direction", "editing"];

  #dragHandle: HTMLElement | null = null;
  #removeBtn: HTMLElement | null = null;
  #dividers: HTMLElement[] = [];
  #childObserver: MutationObserver | null = null;
  #abortController: AbortController | null = null;
  #updatingUI = false;

  get direction(): "horizontal" | "vertical" {
    return (this.getAttribute("direction") as any) || "horizontal";
  }

  get editing(): boolean {
    return this.hasAttribute("editing");
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

  connectedMoveCallback() {}

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
      if (tag === TAG || tag === "patchwork-pipe") {
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
          bubbles: true,
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

  #onDragStart = (event: PointerEvent) => {
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

    const onMove = (ev: PointerEvent) => {
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

      if (
        targetSibling &&
        targetSibling !== this &&
        targetSibling.parentElement === container &&
        targetSibling.tagName.toLowerCase() === TAG
      ) {
        const siblings = Array.from(container.children);
        const currentIndex = siblings.indexOf(this);
        const targetIndex = siblings.indexOf(targetSibling);

        const siblingRect = targetSibling.getBoundingClientRect();
        const isHorizontal = (container as PatchworkSpaceElement).direction !== "vertical";
        const mid = isHorizontal
          ? siblingRect.left + siblingRect.width / 2
          : siblingRect.top + siblingRect.height / 2;
        const pos = isHorizontal ? ev.clientX : ev.clientY;
        const shouldMoveBefore = pos < mid;
        const insertIndex = shouldMoveBefore ? targetIndex : targetIndex + 1;

        targetSibling.classList.add("drop-target");

        if (insertIndex !== currentIndex && insertIndex !== currentIndex + 1) {
          const refNode = insertIndex >= siblings.length ? null : siblings[insertIndex];
          if (canMoveBefore()) {
            container.moveBefore!(this, refNode);
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
        bubbles: true,
      }));
    };

    document.addEventListener("pointermove", onMove, { signal });
    document.addEventListener("pointerup", onUp, { signal });
  };

  // ---- Resize dividers ----

  #getSpaceChildren(): PatchworkSpaceElement[] {
    return Array.from(this.querySelectorAll(`:scope > ${TAG}`)) as PatchworkSpaceElement[];
  }

  #createDividers() {
    this.#removeDividers();
    const spaceChildren = this.#getSpaceChildren();
    if (spaceChildren.length < 2) return;

    // Compute the child depth color so dividers match siblings
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

  #onResizeStart(
    e: PointerEvent,
    divider: HTMLElement,
    beforeEl: PatchworkSpaceElement,
    afterEl: PatchworkSpaceElement
  ) {
    divider.setPointerCapture(e.pointerId);

    const isVertical = this.direction === "vertical";
    const startPos = isVertical ? e.clientY : e.clientX;
    const allChildren = this.#getSpaceChildren();

    // Snapshot ALL sizes BEFORE any style changes
    const snapshots = new Map<PatchworkSpaceElement, number>();
    for (const child of allChildren) {
      const rect = child.getBoundingClientRect();
      snapshots.set(child, isVertical ? rect.height : rect.width);
    }

    const startBefore = snapshots.get(beforeEl)!;
    const startAfter = snapshots.get(afterEl)!;

    // Freeze all children to pixel values to prevent flex redistribution
    for (const [child, size] of snapshots) {
      child.style.flex = `0 0 ${size}px`;
    }

    const onMove = (ev: PointerEvent) => {
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

      // Read final sizes and normalize ALL to proportional ratios
      let totalSize = 0;
      const finalSizes: number[] = [];
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

export function registerPatchworkSpace() {
  if (customElements.get(TAG)) return;
  customElements.define(TAG, PatchworkSpaceElement);
}

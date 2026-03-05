import { computeGrid, getTargetCellSize } from "../layout/storage";

const ELEMENT_NAME = "patchwork-space";

const observedAttrs = [
  "col", "row", "cols", "rows", "collapsible", "collapsed", "data-editing",
] as const;

export class PatchworkSpaceElement extends HTMLElement {
  static observedAttributes = [...observedAttrs];

  #resizeObserver: ResizeObserver | null = null;
  #mutationObserver: MutationObserver | null = null;
  #gridCols = 0;
  #gridRows = 0;

  get isRoot(): boolean {
    return !(this.parentElement instanceof PatchworkSpaceElement);
  }

  get isGroup(): boolean {
    return this.querySelector(`:scope > ${ELEMENT_NAME}`) !== null;
  }

  get isEditing(): boolean {
    return this.hasAttribute("data-editing");
  }

  get col(): number {
    return Number(this.getAttribute("col") ?? 0);
  }
  set col(v: number) {
    this.setAttribute("col", String(v));
  }

  get row(): number {
    return Number(this.getAttribute("row") ?? 0);
  }
  set row(v: number) {
    this.setAttribute("row", String(v));
  }

  get cols(): number {
    return Number(this.getAttribute("cols") ?? 1);
  }
  set cols(v: number) {
    this.setAttribute("cols", String(v));
  }

  get rows(): number {
    return Number(this.getAttribute("rows") ?? 1);
  }
  set rows(v: number) {
    this.setAttribute("rows", String(v));
  }

  get collapsible(): boolean {
    return this.hasAttribute("collapsible");
  }
  set collapsible(v: boolean | string) {
    if (v === false) {
      this.removeAttribute("collapsible");
    } else {
      this.setAttribute("collapsible", "");
    }
  }

  get collapsed(): boolean {
    return this.hasAttribute("collapsed");
  }
  set collapsed(v: boolean | string) {
    if (v === false) {
      this.removeAttribute("collapsed");
    } else {
      this.setAttribute("collapsed", "");
    }
  }

  get gridCols(): number {
    return this.#gridCols;
  }

  get gridRows(): number {
    return this.#gridRows;
  }

  connectedCallback() {
    this.#applyStyles();

    this.#mutationObserver = new MutationObserver(() => this.#applyStyles());
    this.#mutationObserver.observe(this, { childList: true });

    if (this.isRoot) {
      this.#resizeObserver = new ResizeObserver(() => this.#onResize());
      this.#resizeObserver.observe(this);
      this.#onResize();
    }
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#mutationObserver?.disconnect();
    this.#mutationObserver = null;
  }

  attributeChangedCallback(_name: string) {
    this.#applyStyles();
  }

  #onResize() {
    const rect = this.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const { cols, rows } = computeGrid(rect.width, rect.height, getTargetCellSize());
    this.#gridCols = cols;
    this.#gridRows = rows;

    this.style.setProperty("--grid-cols", String(cols));
    this.style.setProperty("--grid-rows", String(rows));
    this.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    this.dispatchEvent(
      new CustomEvent("space:grid-resize", {
        detail: { cols, rows },
        bubbles: true,
      })
    );
  }

  #applyStyles() {
    this.style.display = "grid";
    this.style.position = "relative";

    if (this.isRoot) {
      this.style.width = "100%";
      this.style.height = "100%";
      this.style.overflow = "hidden";
      // Edit mode: gap, padding, bg — animated via CSS transition
      this.style.gap = this.isEditing ? "8px" : "0px";
      this.style.padding = this.isEditing ? "8px" : "0px";
    } else {
      this.style.gridColumn = `${this.col + 1} / span ${this.cols}`;
      this.style.gridRow = `${this.row + 1} / span ${this.rows}`;
      // Allow overflow so edit controls (X button) aren't clipped
      this.style.overflow = this.isEditing ? "visible" : "hidden";

      if (this.isGroup) {
        this.style.gridTemplateColumns = "subgrid";
        this.style.gridTemplateRows = "subgrid";
      } else {
        this.style.gridTemplateColumns = "1fr";
        this.style.gridTemplateRows = "1fr";
      }
    }

    if (this.collapsed) {
      this.style.minWidth = "0";
      this.style.minHeight = "0";
    }
  }
}

export function registerPatchworkSpaceElement() {
  if (customElements.get(ELEMENT_NAME)) return;
  customElements.define(ELEMENT_NAME, PatchworkSpaceElement);
}

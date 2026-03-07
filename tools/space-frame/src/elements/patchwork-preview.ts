import { LitElement, html } from "lit";

const ELEMENT_NAME = "patchwork-preview";

export class PatchworkPreviewElement extends LitElement {
  #iframe: HTMLIFrameElement | null = null;
  #currentBlobUrl: string | null = null;

  createRenderRoot() {
    return this;
  }

  get value(): string | Blob | null {
    return null;
  }

  set value(v: string | Blob | null) {
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
    super.connectedCallback();
    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.overflow = "hidden";

    this.#iframe = document.createElement("iframe");
    this.#iframe.style.cssText =
      "width:100%;height:100%;border:none;background:transparent;";
    this.#iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.appendChild(this.#iframe);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#currentBlobUrl = null;
    }
    this.#iframe = null;
  }
}

export function registerPatchworkPreviewElement() {
  if (customElements.get(ELEMENT_NAME)) return;
  customElements.define(ELEMENT_NAME, PatchworkPreviewElement);
}

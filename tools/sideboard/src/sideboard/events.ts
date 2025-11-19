import type { OpenDocumentEventDetail } from "@patchwork/elements";

export function createOpenEvent(detail: OpenDocumentEventDetail) {
  const openEvent = new CustomEvent("patchwork:open-document", {
    detail,
    bubbles: true,
    composed: true,
  });
  return openEvent;
}

export function createOpenEventHandler(detail: OpenDocumentEventDetail) {
  return function (this: HTMLElement, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const openEvent = createOpenEvent(detail);
    this.dispatchEvent(openEvent);
  };
}

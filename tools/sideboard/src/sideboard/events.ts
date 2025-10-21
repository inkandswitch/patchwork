import type { AutomergeUrl } from "@automerge/automerge-repo";

export function createOpenEvent(url: AutomergeUrl, toolId?: string) {
  const openEvent = new CustomEvent("patchwork:open-document", {
    detail: { url, toolId },
    bubbles: true,
    composed: true,
  });
  return openEvent;
}

export function createOpenEventHandler(url: AutomergeUrl, toolId?: string) {
  return function (this: HTMLElement, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const openEvent = createOpenEvent(url, toolId);
    this.dispatchEvent(openEvent);
  };
}

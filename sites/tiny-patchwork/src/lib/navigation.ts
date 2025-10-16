import { AutomergeUrl } from "@automerge/automerge-repo";

interface OpenDocumentEventDetail {
  url: AutomergeUrl;
  toolId?: string;
}

export class OpenDocumentEvent extends CustomEvent<OpenDocumentEventDetail> {
  constructor(detail: OpenDocumentEventDetail) {
    super("patchwork:open-document", { detail });
  }
}

declare global {
  interface ShadowRootEventMap extends ElementEventMap {
    "patchwork:open-document": OpenDocumentEvent;
  }
  interface ElementEventMap {
    "patchwork:open-document": OpenDocumentEvent;
  }
}

export const openDocument = (
  element: HTMLElement | ShadowRoot,
  url: AutomergeUrl,
  toolId?: string
) => {
  element.dispatchEvent(new OpenDocumentEvent({ url, toolId }));
};

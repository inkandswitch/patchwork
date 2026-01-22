import { AutomergeUrl } from "@automerge/automerge-repo";

export interface OpenDocumentEventDetail {
  url: AutomergeUrl;
  toolId?: string;
  title?: string;
  type?: string;
}

export class OpenDocumentEvent extends CustomEvent<OpenDocumentEventDetail> {
  constructor(detail: OpenDocumentEventDetail) {
    super("patchwork:open-document", {
      detail,
      composed: true,
      bubbles: true,
    });
  }
}

export interface MountedEventDetail {
  url: AutomergeUrl;
  toolId: string;
}

export class MountedEvent extends CustomEvent<MountedEventDetail> {
  constructor(detail: MountedEventDetail) {
    super("patchwork:mounted", {
      detail,
      composed: true,
      bubbles: true,
    });
  }
}

declare global {
  interface ShadowRootEventMap extends ElementEventMap {
    "patchwork:open-document": OpenDocumentEvent;
    "patchwork:mounted": MountedEvent;
  }
  interface ElementEventMap {
    "patchwork:open-document": OpenDocumentEvent;
    "patchwork:mounted": MountedEvent;
  }
}

export const openDocument = (
  element: HTMLElement | ShadowRoot,
  url: AutomergeUrl,
  toolId?: string
) => {
  element.dispatchEvent(new OpenDocumentEvent({ url, toolId }));
};

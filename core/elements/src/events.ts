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

export interface NoToolEventDetail {
  url: AutomergeUrl;
}

export class NoToolEvent extends CustomEvent<NoToolEventDetail> {
  constructor(detail: NoToolEventDetail) {
    super("patchwork:no-tool", {
      detail,
      composed: true,
      bubbles: true,
    });
  }
}

export interface ToolSelectedEventDetail {
  toolUrl: string | null;
  toolId: string | null;
}

export class ToolSelectedEvent extends CustomEvent<ToolSelectedEventDetail> {
  constructor(detail: ToolSelectedEventDetail) {
    super("patchwork:tool-selected", {
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
    "patchwork:no-tool": NoToolEvent;
    "patchwork:tool-selected": ToolSelectedEvent;
  }
  interface ElementEventMap {
    "patchwork:open-document": OpenDocumentEvent;
    "patchwork:mounted": MountedEvent;
    "patchwork:no-tool": NoToolEvent;
    "patchwork:tool-selected": ToolSelectedEvent;
  }
}

export const openDocument = (
  element: HTMLElement | ShadowRoot,
  url: AutomergeUrl,
  toolId?: string
) => {
  element.dispatchEvent(new OpenDocumentEvent({ url, toolId }));
};

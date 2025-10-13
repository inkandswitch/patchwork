import { AutomergeUrl } from "@automerge/automerge-repo";
import { DocLink } from "@patchwork/filesystem";

export class OpenDocumentEvent extends Event {
  constructor(public docLink: DocLink) {
    super("patchwork:open-document", { bubbles: true, composed: true });
  }
}

export const openDocument = (
  element: HTMLElement | ShadowRoot,
  docLink: DocLink
) => {
  element.dispatchEvent(new OpenDocumentEvent(docLink));
};

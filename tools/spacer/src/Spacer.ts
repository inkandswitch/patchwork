import { type DocHandle } from "@automerge/automerge-repo";

export const renderSpacer = (
  handle: DocHandle<unknown>,
  element: HTMLElement
) => {
  element.style.flex = "1";

  return () => {};
};

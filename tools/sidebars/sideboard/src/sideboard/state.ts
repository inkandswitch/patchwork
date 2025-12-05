import type { AutomergeUrl } from "@automerge/automerge-repo";
import { annotations } from "@patchwork/annotations-context";
import { IsSelected } from "@patchwork/annotations-selection";
import { createSignal, from } from "solid-js";

export const [filter, setFilter] = createSignal("");

export function filterMatches(string: string) {
  return !!string?.toLowerCase().includes(filter());
}

// todo: this is annoying that we need to pass annotations twice to from
const rawSelectionAnnotations = annotations.ofType(IsSelected);
const selectionAnnotations = from(
  rawSelectionAnnotations,
  rawSelectionAnnotations
);

const selectedDocUrls = () => {
  return Array.from(selectionAnnotations() ?? []).map(
    ([ref]) => ref.docHandle.url
  );
};

export { selectedDocUrls };

export const documentIsOpen = (url: AutomergeUrl) =>
  selectedDocUrls()?.includes(url);

export const [renaming, setRenaming] = createSignal("");

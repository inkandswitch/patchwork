import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { defineAnnotationType } from "@patchwork/annotations";
import { annotations } from "@patchwork/annotations-context";
import { compute } from "@patchwork/observable";
import type { Ref } from "@patchwork/refs";

/**
 * Annotation type for marking refs as selected.
 */
export const IsSelected = defineAnnotationType<boolean>("patchwork/isSelected");

/**
 * Computed observable of all refs that are selected (IsSelected === true).
 */
export const selectedRefs = compute(
  annotations.ofType(IsSelected),
  (annotations) => Array.from(annotations.refs)
);

/**
 * Computed observable of all refs to documents that have selections.
 * Returns the document-level refs (not the specific selected locations within docs).
 */
export const selectedDocRefs = compute(selectedRefs, (selectedRefs) =>
  selectedRefs.filter((ref) => ref.docHandle.url !== ref.url)
);

/**
 * Computed observable of all document URLs that have selections.
 */
export const selectedDocUrls = compute(
  annotations.ofType(IsSelected),
  (view): AutomergeUrl[] => {
    const urls = new Set<AutomergeUrl>();

    for (const [ref] of view) {
      urls.add(ref.docHandle.url);
    }

    return Array.from(urls);
  }
);

/**
 * Computed observable of all document handles that have selections.
 */
export const selectedDocHandles = compute(
  annotations.ofType(IsSelected),
  (view): DocHandle<unknown>[] => {
    const handles = new Map<string, DocHandle<unknown>>();

    for (const [ref] of view) {
      const url = ref.docHandle.url;
      if (!handles.has(url)) {
        handles.set(url, ref.docHandle);
      }
    }

    return Array.from(handles.values());
  }
);

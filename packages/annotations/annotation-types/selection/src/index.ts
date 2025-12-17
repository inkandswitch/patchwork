import { defineAnnotationType } from "@patchwork/annotations";
import { annotations } from "@patchwork/annotations-context";
import { compute, type Observable } from "@patchwork/observable";
import { Ref } from "@patchwork/refs";

/**
 * Annotation type for marking refs as selected.
 */
export const IsSelected = defineAnnotationType<boolean>("patchwork/isSelected");

/**
 * Computed observable that returns all refs that are currently selected.
 */
export const $selectedRefs: Observable<Ref[]> = compute(annotations, () => {
  const result: Ref[] = [];
  for (const [ref, annotation] of annotations.entriesOfType(IsSelected)) {
    if (annotation.value === true) {
      result.push(ref);
    }
  }
  return result;
});

/**
 * Computed observable that returns whether a specific ref is selected.
 */
export function isSelected(ref: Ref): Observable<boolean> {
  return compute($selectedRefs, (selectedRefs) => selectedRefs.includes(ref));
}

/**
 * Computed observable that returns unique document URLs of all selected refs.
 */
export const $selectedDocUrls = compute($selectedRefs, (selectedRefs) => {
  const docUrls = selectedRefs.map((ref) => ref.docHandle.url);
  return Array.from(new Set(docUrls));
});

/**
 * Computed observable that returns unique document handles of all selected refs.
 */
export const $selectedDocHandles = compute($selectedRefs, (selectedRefs) => {
  const docHandles = selectedRefs.map((ref) => ref.docHandle);
  return Array.from(new Set(docHandles));
});

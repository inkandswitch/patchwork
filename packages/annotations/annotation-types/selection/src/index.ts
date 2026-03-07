import { defineAnnotationType } from "@inkandswitch/annotations";
import { annotations } from "@inkandswitch/annotations-context";
import { computed, Subscribable } from "@inkandswitch/subscribables";
import type { Ref } from "@automerge/automerge-repo";

/**
 * Helper function to check if two arrays contain the same values in the same order.
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Annotation type for marking refs as selected.
 */
export const IsSelected = defineAnnotationType<boolean>("patchwork/isSelected");

/**
 * Computed observable that returns all refs that are currently selected.
 */
export const $selectedRefs: Subscribable<Ref[]> = computed(
  annotations.ofType(IsSelected),
  (isSelectedAnnotations) => {
    const result: Ref[] = [];
    for (const [ref, annotation] of isSelectedAnnotations) {
      if (annotation.value === true) {
        result.push(ref);
      }
    }
    return result;
  }
);

/**
 * Computed observable that returns whether a specific ref is selected.
 */
export function isSelected(ref: Ref): Subscribable<boolean> {
  return computed($selectedRefs, (selectedRefs) =>
    selectedRefs.some(
      (otherRef) => otherRef.overlaps(ref) || otherRef.isEquivalent(ref)
    )
  );
}

/**
 * Computed observable that returns unique document URLs of all selected refs.
 */
let cachedDocUrls: string[] = [];
export const $selectedDocUrls = computed($selectedRefs, (selectedRefs) => {
  const docUrls = selectedRefs.map((ref) => ref.docHandle.url);
  const uniqueDocUrls = Array.from(new Set(docUrls));

  // If we'd return an empty array but we have a cached value, keep the cached value
  // This handles the case where annotations are briefly empty during document updates
  if (uniqueDocUrls.length === 0 && cachedDocUrls.length > 0) {
    return cachedDocUrls;
  }

  // Only return a new array if the contents have actually changed
  if (arraysEqual(uniqueDocUrls, cachedDocUrls)) {
    return cachedDocUrls;
  }

  cachedDocUrls = uniqueDocUrls;
  return uniqueDocUrls;
});

/**
 * Computed observable that returns unique document handles of all selected refs.
 */
export const $selectedDocHandles = computed($selectedRefs, (selectedRefs) => {
  const docHandles = selectedRefs.map((ref) => ref.docHandle);
  return Array.from(new Set(docHandles));
});

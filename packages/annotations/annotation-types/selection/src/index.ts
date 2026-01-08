import { defineAnnotationType } from "@inkandswitch/annotations";
import { annotations } from "@inkandswitch/annotations-context";
import { computed, Subscribable } from "@inkandswitch/subscribables";
import { Ref } from "@inkandswitch/patchwork-refs";

/**
 * Annotation type for marking refs as selected.
 */
export const IsSelected = defineAnnotationType<boolean>("patchwork/isSelected");

/**
 * Computed observable that returns all refs that are currently selected.
 */
export const $selectedRefs: Subscribable<Ref[]> = computed(
  annotations.ofType(IsSelected),
  () => {
    const result: Ref[] = [];
    for (const [ref, annotation] of annotations) {
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
  return computed($selectedRefs, (selectedRefs) => selectedRefs.includes(ref));
}

/**
 * Computed observable that returns unique document URLs of all selected refs.
 */
export const $selectedDocUrls = computed($selectedRefs, (selectedRefs) => {
  const docUrls = selectedRefs.map((ref) => ref.docHandle.url);
  return Array.from(new Set(docUrls));
});

/**
 * Computed observable that returns unique document handles of all selected refs.
 */
export const $selectedDocHandles = computed($selectedRefs, (selectedRefs) => {
  const docHandles = selectedRefs.map((ref) => ref.docHandle);
  return Array.from(new Set(docHandles));
});

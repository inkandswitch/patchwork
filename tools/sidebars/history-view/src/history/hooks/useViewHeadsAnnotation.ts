import { createEffect, onCleanup, Accessor } from "solid-js";
import { annotations as ANNOTATIONS } from "@inkandswitch/annotations-context";
import { AnnotationSet } from "@inkandswitch/annotations";
import { ViewHeads } from "@inkandswitch/annotations-diff";
import type { ViewHeadsType } from "../../types";

/**
 * Hook to manage ViewHeads annotations
 * Adds/removes annotations from the global context based on viewHeads state
 */
export function useViewHeadsAnnotation(
  viewHeads: Accessor<ViewHeadsType | null>,
  docRef: Accessor<any | undefined>
) {
  // Create AnnotationSet once per component instance
  const annotations = new AnnotationSet();

  // Add to global annotations on mount, remove on cleanup
  ANNOTATIONS.add(annotations);
  onCleanup(() => {
    ANNOTATIONS.remove(annotations);
  });

  // Update annotation contents when viewHeads changes
  createEffect(() => {
    const currentViewHeads = viewHeads();
    const currentDocRef = docRef();

    annotations.change(() => {
      // Remove only the specific ViewHeads annotation (not everything)
      if (currentDocRef) {
        annotations.remove(currentDocRef, ViewHeads);
      }
      // Add the new ViewHeads
      if (currentViewHeads && currentDocRef) {
        annotations.add(currentDocRef, ViewHeads(currentViewHeads));
      }
    });
  });
}

import { createEffect, onCleanup, type Accessor } from "solid-js";
import { AnnotationSet } from "@inkandswitch/annotations";
import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import { IsSelected } from "@inkandswitch/annotations-selection";
import { CommentThread } from "@inkandswitch/annotations-comments";
import type { Ref } from "@automerge/automerge-repo";
import type {
  SerializedCommentThread,
  CommentThread as CommentThreadType,
} from "@inkandswitch/annotations-comments";

interface UseAnnotationsParams {
  selectedDocRef: Accessor<Ref | undefined>;
  commentThreadsWithRef: Accessor<
    [Ref<SerializedCommentThread>, CommentThreadType][]
  >;
}

/**
 * Manages global annotations for the selected document
 *
 * Creates an AnnotationSet and contributes it to the global annotations context.
 * Handles selection annotations and comment thread annotations.
 */
export function useAnnotations({
  selectedDocRef,
  commentThreadsWithRef,
}: UseAnnotationsParams) {
  // AnnotationSet is created at component level to persist across effect reruns
  const annotations = new AnnotationSet();

  // Add/remove annotations from global context
  createEffect(() => {
    const docRef = selectedDocRef();
    if (!docRef) {
      return;
    }

    globalAnnotations.add(annotations);

    onCleanup(() => {
      globalAnnotations.remove(annotations);
    });
  });

  // Update annotations when selection or comment threads change
  createEffect(() => {
    const docRef = selectedDocRef();
    if (!docRef) {
      return;
    }

    annotations.change(() => {
      annotations.clear();

      // Add selection annotation
      annotations.add(docRef, IsSelected(true));

      // Add comment thread annotations
      const threads = commentThreadsWithRef();
      for (const [threadRef, thread] of threads) {
        for (const ref of thread.refs) {
          if (threadRef.value()?.isResolved) {
            continue;
          }

          annotations.add(ref, CommentThread(threadRef));
        }
      }
    });
  });

  return {
    annotations,
  };
}

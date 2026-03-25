import { useDocHandle } from "@automerge/automerge-repo-solid-primitives";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import {
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  type Accessor,
} from "solid-js";
import type { DocWithComments } from "@inkandswitch/annotations-comments";
import { commentThreadsWithRefOfDoc } from "@inkandswitch/annotations-comments";

/**
 * Loads comment threads for a document and returns them with their refs
 *
 * Note: We use useDocHandle instead of useDocument to avoid wrapping the document
 * with autoproduce, which would conflict with pattern-based refs used by other tools
 * (e.g., CommentsView sidebar using refs like {id: commentId} in array paths)
 */
export function useCommentThreads(
  docHandleAccessor: Accessor<DocHandle<DocWithComments> | undefined>,
  repo: Repo
) {
  const docHandle = useDocHandle<DocWithComments>(
    () => docHandleAccessor()?.url,
    { repo }
  );
  const [docVersion, setDocVersion] = createSignal(0);

  createEffect(() => {
    const handle = docHandle();
    if (!handle) return;
    const onChange = () => {
      setDocVersion((v) => v + 1);
    };
    handle.on("change", onChange);
    onCleanup(() => handle.off("change", onChange));
  });

  const [commentThreadsWithRef] = createResource(
    () => {
      const handle = docHandle();
      if (!handle) return;
      docVersion(); // Track doc changes to reload comment threads when the source changes)
      return { handle };
    },
    async ({ handle }) => {
      if (!handle) return [];
      return await commentThreadsWithRefOfDoc(handle, repo);
    }
  );

  return () => commentThreadsWithRef() ?? [];
}

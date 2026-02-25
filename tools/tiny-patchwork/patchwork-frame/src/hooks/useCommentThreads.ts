import { useDocHandle } from "@automerge/automerge-repo-solid-primitives";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import { createResource, type Accessor } from "solid-js";
import type { DocWithComments } from "@inkandswitch/annotations-comments";
import { commentThreadsWithRefOfDoc } from "@inkandswitch/annotations-comments";

/**
 * Loads comment threads for a document and returns them with their refs
 *
 * Note: We use useDocHandle instead of useDocument to avoid wrapping the document
 * with autoproduce, which would conflict with pattern-based refs used by other tools
 * (e.g., CommentsView sidebar using refs like {id: commentId} in array paths)
 * TODO: this whole pattern is a Claude "fix" that resolves errors like "Uncaught RangeError: index is not a number for patch" when saving changes to a comment (save or resolve) but does not fix reactivity issues. It should be debugged & fixed properly alongside annotations/comments and the comments-view sidebar.
 */
export function useCommentThreads(
  docHandleAccessor: Accessor<DocHandle<DocWithComments> | undefined>,
  repo: Repo
) {
  const docHandle = useDocHandle<DocWithComments>(
    () => docHandleAccessor()?.url,
    { repo }
  );

  const [commentThreadsWithRef] = createResource(
    () => {
      const handle = docHandle();
      // Track document changes by reading doc() but don't use autoproduce wrapper
      // This creates a dependency that triggers refetch when document changes
      const changeSignal = handle?.doc() ? Math.random() : 0;
      return { handle, changeSignal };
    },
    async ({ handle }) => {
      if (!handle) return [];
      return await commentThreadsWithRefOfDoc(handle, repo);
    }
  );

  return () => commentThreadsWithRef() ?? [];
}

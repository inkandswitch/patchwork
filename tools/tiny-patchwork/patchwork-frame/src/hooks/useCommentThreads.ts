import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import { createResource, type Accessor } from "solid-js";
import type { DocWithComments } from "@inkandswitch/annotations-comments";
import { commentThreadsWithRefOfDoc } from "@inkandswitch/annotations-comments";

/**
 * Loads comment threads for a document and returns them with their refs
 */
export function useCommentThreads(
  docHandleAccessor: Accessor<DocHandle<DocWithComments> | undefined>,
  repo: Repo
) {
  const [doc] = useDocument(() => docHandleAccessor()?.url, { repo });

  const [commentThreadsWithRef] = createResource(
    () => {
      const docHandle = docHandleAccessor();
      // Track for reactivity only
      // TODO: there's probably a better way
      doc();
      return docHandle;
    },
    async (docHandle) => {
      if (!docHandle) return [];
      return await commentThreadsWithRefOfDoc(docHandle, repo);
    }
  );

  return () => commentThreadsWithRef() ?? [];
}

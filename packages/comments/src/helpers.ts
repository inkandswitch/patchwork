import type { DocHandle, Ref } from "@automerge/automerge-repo";
import type { Comment, CommentThread, DocWithComments } from "./types.js";

/**
 * Create a new comment thread attached to the given refs.
 * Returns a Ref pointing to the newly-created thread.
 */
export function createCommentThread(refs: Ref[]): Ref<CommentThread> {
  const docHandle = refs[0].docHandle as DocHandle<DocWithComments>;
  const docRef = docHandle.ref();
  const threadId = crypto.randomUUID();

  docRef.change((doc) => {
    if (!doc["@comments"]) {
      doc["@comments"] = { threads: [] };
    }

    doc["@comments"].threads.push({
      id: threadId,
      refs: refs.map((r) => r.url),
      isResolved: false,
      comments: [],
    });
  });

  return docHandle.ref("@comments", "threads", {
    id: threadId,
  }) as Ref<CommentThread>;
}

/**
 * Create a reply in a thread.
 * Returns a Ref pointing to the new comment.
 */
export function createReply({
  threadRef,
  content,
  contactUrl,
}: {
  threadRef: Ref<CommentThread>;
  content?: string;
  contactUrl: string;
}): Ref<Comment> {
  const commentId = crypto.randomUUID();

  threadRef.change((thread) => {
    const comment: Comment = {
      id: commentId,
      contactUrl,
      timestamp: Date.now(),
    };

    if (content) {
      comment.content = content;
    }

    thread.comments.push(comment);
  });

  const docHandle = threadRef.docHandle as DocHandle<DocWithComments>;
  const threadId = threadRef.value()?.id;
  if (!threadId) {
    throw new Error("createReply: thread ref did not resolve to a thread");
  }

  return docHandle.ref(
    "@comments",
    "threads",
    { id: threadId },
    "comments",
    { id: commentId }
  ) as Ref<Comment>;
}

/**
 * Create a comment with a new thread.
 */
export function createComment({
  refs,
  content,
  contactUrl,
}: {
  refs: Ref[];
  content: string;
  contactUrl: string;
}): Ref<Comment> {
  const threadRef = createCommentThread(refs);
  return createReply({ threadRef, content, contactUrl });
}

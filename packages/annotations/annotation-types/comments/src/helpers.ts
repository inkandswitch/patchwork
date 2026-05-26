import { DocHandle, type Ref } from "@automerge/automerge-repo";
import { DocWithComments, CommentThread, Comment } from "./types";

/**
 * Create a new comment thread attached to the given refs.
 */
export function createCommentThread(refs: Ref[]): Ref {
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

  return docHandle.ref("@comments", "threads", { id: threadId });
}

/**
 * Create a reply in a thread.
 */
export function createReply({
  threadRef,
  content,
  contactUrl,
}: {
  threadRef: Ref<any>;
  content?: string;
  contactUrl: string;
}): Ref {
  const commentId = crypto.randomUUID();

  threadRef.change((thread: CommentThread) => {
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
  const threads = docHandle.doc()["@comments"]?.threads ?? [];
  const threadValue = threadRef.value() as CommentThread | undefined;
  const threadIndex = threads.findIndex((t) => t.id === threadValue?.id);

  return docHandle.ref("@comments", "threads", threadIndex, "comments", {
    id: commentId,
  });
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
}): Ref {
  const threadRef = createCommentThread(refs);
  return createReply({ threadRef, content, contactUrl });
}

/**
 * Load stored comment threads from a document.
 */
export function commentThreadsWithRefOfDoc(
  docHandle: DocHandle<DocWithComments>
): [Ref<CommentThread>, CommentThread][] {
  const threads = docHandle.doc()["@comments"]?.threads;
  if (!threads) {
    return [];
  }

  return threads.map((thread) => {
    const threadRef = docHandle.ref("@comments", "threads", {
      id: thread.id,
    }) as Ref<CommentThread>;
    return [threadRef, thread];
  });
}

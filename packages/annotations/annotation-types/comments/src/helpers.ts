import { DocHandle } from "@automerge/automerge-repo";
import { Ref, ref } from "@patchwork/refs";
import { DocWithComments, CommentThread, Comment } from "./types";
import { AnnotationSet } from "@inkandswitch/annotations";

/**
 * Create a new comment thread attached to the given refs.
 */
export function createCommentThread(refs: Ref[]): Ref<DocWithComments> {
  const docHandle = refs[0].docHandle as DocHandle<DocWithComments>;
  const docRef = ref(docHandle);
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

  return ref(docHandle, "@comments", "threads", { id: threadId });
}

/**
 * Create a reply in a thread.
 */
export function createReply({
  threadRef,
  content,
  authorId,
}: {
  threadRef: Ref;
  content?: string;
  authorId: string;
}): Ref<DocWithComments> {
  const commentId = crypto.randomUUID();

  threadRef.change((thread) => {
    const comment: Comment = {
      id: commentId,
      authorId,
      timestamp: Date.now(),
    };

    if (content) {
      comment.content = content;
    }

    (thread as CommentThread).comments.push(comment);
  });

  const docHandle = threadRef.docHandle as DocHandle<DocWithComments>;
  const threads = docHandle.doc()["@comments"]?.threads ?? [];
  const threadValue = threadRef.value() as CommentThread | undefined;
  const threadIndex = threads.findIndex((t) => t.id === threadValue?.id);

  return ref(docHandle, "@comments", "threads", threadIndex, "comments", {
    id: commentId,
  });
}

/**
 * Create a comment with a new thread.
 */
export function createComment({
  refs,
  content,
  authorId,
}: {
  refs: Ref[];
  content: string;
  authorId: string;
}): Ref<DocWithComments> {
  const threadRef = createCommentThread(refs);
  return createReply({ threadRef, content, authorId });
}

/**
 * Load stored comment threads from a document and return an AnnotationSet.
 */
export function threadAnnotationsOfDoc(
  docHandle: DocHandle<DocWithComments>
): AnnotationSet {
  const result = new AnnotationSet();
  const storedThreads = docHandle.doc()["@comments"]?.threads;

  if (!storedThreads) {
    return result;
  }

  for (const thread of storedThreads) {
    const threadRef = ref(docHandle, "@comments", "threads", { id: thread.id });

    for (const refUrl of thread.refs) {
      const targetRef = Ref.fromUrl(docHandle, refUrl);
      result.add(targetRef, CommentThread(threadRef));
    }
  }

  return result;
}

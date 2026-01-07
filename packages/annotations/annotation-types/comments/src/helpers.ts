import { DocHandle, Repo } from "@automerge/automerge-repo";
import { type Ref, type RefOfType, ref, findRef } from "@patchwork/refs";
import { DocWithComments, CommentThread, Comment } from "./types";
import type {
  CommentThread as CommentThreadType,
  SerializedCommentThread,
} from "./types";
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
  contactUrl,
}: {
  threadRef: Ref;
  content?: string;
  contactUrl: string;
}): Ref<DocWithComments> {
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
  contactUrl,
}: {
  refs: Ref[];
  content: string;
  contactUrl: string;
}): Ref<DocWithComments> {
  const threadRef = createCommentThread(refs);
  return createReply({ threadRef, content, contactUrl });
}

/**
 * Load stored comment threads from a document and return an AnnotationSet.
 */
export async function commentThreadsWithRefOfDoc(
  docHandle: DocHandle<DocWithComments>,
  repo: Repo
): Promise<[RefOfType<SerializedCommentThread>, CommentThread][]> {
  const result = new AnnotationSet();
  const serializedThreads = docHandle.doc()["@comments"]?.threads;

  if (!serializedThreads) {
    return [];
  }

  return await Promise.all(
    serializedThreads.map(async (serializedThread) => {
      const thread = {
        ...serializedThread,
        refs: await Promise.all(
          serializedThread.refs.map((refUrl) => findRef(repo, refUrl))
        ),
      };
      const threadRef = ref(docHandle, "@comments", "threads", {
        id: thread.id,
      });

      return [threadRef as RefOfType<SerializedCommentThread>, thread];
    })
  );
}

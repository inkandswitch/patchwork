import { DocHandle } from "@automerge/automerge-repo";
import { CONTEXT, defineField } from "../core";
import { contextComputation } from "../core/computation";
import { IdRef, loadRef, Ref, RefWith, SerializedRef } from "../core/refs";
import { memoize } from "../utils/memoize";

export type Thread = {
  id: string;
  refs: SerializedRef[];
  isResolved: boolean;
  comments: Comment[];
};

export type DocWithComments = {
  "@comments"?: {
    threads: Thread[];
  };
};

export type Comment = {
  id: string;
  content?: string;
  draftContent?: string;
  authorId: string;
  timestamp: number;
};

// todo: add support for collection fields
const ThreadSymbol = Symbol("thread");
export type ThreadField = typeof ThreadSymbol;
export const ThreadField = defineField<ThreadField, Ref<Thread>>(
  "commentThreads",
  ThreadSymbol
);

export const getCommentThreads = memoize(
  (ref: Ref) =>
    contextComputation(() => {
      const threads = CONTEXT.resolve(ref).get(ThreadField);
      return threads ? [threads] : [];
    }),
  (ref: Ref) => ref.toId()
);

export const getStoredThreads = (
  docHandle: DocHandle<DocWithComments>
): RefWith<ThreadField>[] => {
  const refsWithThreads: RefWith<ThreadField>[] = [];

  const storedThreads = docHandle.doc()["@comments"]?.threads;

  if (!storedThreads) {
    return [];
  }

  for (const thread of Object.values(storedThreads)) {
    const threadRef = new IdRef<Thread>(
      docHandle,
      ["@comments", "threads"],
      thread.id,
      "id"
    );

    for (const serializedRef of thread.refs) {
      const ref = loadRef(docHandle, serializedRef);

      refsWithThreads.push(ref.with(ThreadField(threadRef)));
    }
  }

  return refsWithThreads;
};

export const getThreadsAt = memoize(
  (ref?: Ref) =>
    contextComputation(() => {
      if (!ref) {
        return [];
      }

      return CONTEXT.refsWith(ThreadField).filter((refWithComments) => {
        return refWithComments.isElementOf(ref);
      });
    }),
  (ref?: Ref) => ref?.toId()
);

export const createReply = ({
  threadRef,
  content,
  authorId,
}: {
  threadRef: Ref<Thread>;
  content?: string;
  authorId: string;
}): Ref<Comment> => {
  const docRef = threadRef.docRef as Ref<DocWithComments, DocWithComments>;

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

    thread.comments.push(comment);
  });

  return new IdRef(
    docRef.docHandle,
    ["@comments", "threads", threadRef.value.id, "comments"],
    commentId,
    "id"
  );
};

export const createCommentThread = (refs: Ref[]): Ref<Thread> => {
  // todo: handle comments across documents
  const docRef = refs[0].docRef as Ref<DocWithComments, DocWithComments>;

  const threadId = crypto.randomUUID();

  docRef.change((doc) => {
    if (!doc["@comments"]) {
      doc["@comments"] = {
        threads: [],
      };
    }

    doc["@comments"].threads.push({
      id: threadId,
      refs: refs.map((ref) => ref.serialize()),
      isResolved: false,
      comments: [],
    });
  });

  return new IdRef(docRef.docHandle, ["@comments", "threads"], threadId, "id");
};

export const createComment = ({
  refs,
  content,
  authorId,
}: {
  refs: Ref[];
  content: string;
  authorId: string;
}): Ref<Comment> => {
  const threadRef = createCommentThread(refs);

  return createReply({
    threadRef,
    content,
    authorId,
  });
};

export const $allActiveThreadRefs = contextComputation<Ref<Thread>[]>(
  (context) => {
    const threadRefsById = new Map<string, Ref<Thread>>();

    for (const refWithThread of context.refsWith(ThreadField)) {
      const threadRef = refWithThread.get(ThreadField);
      threadRefsById.set(threadRef.value.id, threadRef);
    }

    return Array.from(threadRefsById.values());
  }
);

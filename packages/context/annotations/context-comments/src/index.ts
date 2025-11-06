import { DocHandle } from "@automerge/automerge-repo";
import {
  CONTEXT,
  contextComputation,
  IdRef,
  loadRef,
  Ref,
  SerializedRef,
  defineAnnotation,
} from "@patchwork/context";

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

const ThreadAnnotation = defineAnnotation<Ref<Thread>>(
  "patchwork/commentThread"
);

export const getCommentThreads = (ref: Ref) =>
  contextComputation(() => {
    const threads = CONTEXT.resolve(ref).get(ThreadAnnotation);
    return threads ? [threads] : [];
  });

export const getStoredThreads = (
  docHandle: DocHandle<DocWithComments>
): Ref[] => {
  const refsWithThreads: Ref[] = [];

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

      refsWithThreads.push(ref.with(ThreadAnnotation(threadRef)));
    }
  }

  return refsWithThreads;
};

export const getThreadsAt = (ref: Ref) =>
  contextComputation(() => {
    if (!ref) {
      return [];
    }

    return CONTEXT.refsWith(ThreadAnnotation).filter((refWithComments) => {
      return refWithComments.isElementOf(ref);
    });
  });

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

  const threadIndex = (threadRef.docHandle.doc() as DocWithComments)[
    "@comments"
  ]!.threads.findIndex((thread) => thread.id === threadRef.value.id);

  return new IdRef(
    docRef.docHandle,
    ["@comments", "threads", threadIndex, "comments"],
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
    const threadRefs = context
      .refsWith(ThreadAnnotation)
      .flatMap((refWithThread) => {
        const threadRef = refWithThread.get(ThreadAnnotation)!;

        if (threadRef.value.isResolved) {
          return [];
        }

        return [threadRef];
      });

    // we need to preserver some order
    // hack: Sort by timestamp of first comment (ascending: oldest first)
    threadRefs.sort((a, b) => {
      const aTimestamp = a.value.comments[0]?.timestamp ?? 0;
      const bTimestamp = b.value.comments[0]?.timestamp ?? 0;
      return aTimestamp - bTimestamp;
    });

    return threadRefs;
  }
);

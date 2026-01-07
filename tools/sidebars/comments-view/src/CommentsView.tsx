import "./styles.css";
import { useState, useEffect, useMemo } from "react";

import { relativeTime } from "@patchwork/util/src/relative-time";
import { toolify } from "@inkandswitch/patchwork-react";
import { useRepo, useDocument } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/automerge-repo";

import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import { AnnotationSet } from "@inkandswitch/annotations";
import { IsSelected } from "@inkandswitch/annotations-selection";
import { computed } from "@inkandswitch/subscribables";
import {
  CommentThread,
  SerializedCommentThread,
  Comment,
  createReply,
} from "@inkandswitch/annotations-comments";
import { useSubscribe } from "@inkandswitch/subscribables-react";
import {
  Ref,
  RefOfType,
  ref,
  findRef,
  RefUrl,
} from "@inkandswitch/patchwork-refs";
import { useRefValue } from "@inkandswitch/patchwork-refs-react";
import { Repo } from "@automerge/automerge-repo";

const CommentsView = () => {
  const allActiveThreadRefs = useSubscribe($allActiveThreadRefs);

  // Local annotation set for selection from comments sidebar
  const selectionAnnotations = useMemo(() => new AnnotationSet(), []);

  // Register/unregister with global annotations
  useEffect(() => {
    globalAnnotations.add(selectionAnnotations);
    return () => {
      globalAnnotations.remove(selectionAnnotations);
    };
  }, [selectionAnnotations]);

  const onSelectRefs = (refs: Ref[]) => {
    selectionAnnotations.change(() => {
      selectionAnnotations.clear();
      for (const ref of refs) {
        selectionAnnotations.add(ref, IsSelected(true));
      }
    });
  };

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {Array.from(allActiveThreadRefs).map((threadRef) => (
        <ThreadView
          key={threadRef.toString()}
          threadRef={threadRef}
          onSelectRefs={onSelectRefs}
        />
      ))}
    </div>
  );
};

export const renderCommentsView = toolify(CommentsView);

const ThreadView = ({
  threadRef,
  onSelectRefs,
}: {
  threadRef: RefOfType<SerializedCommentThread>;
  onSelectRefs: (refs: Ref[]) => void;
}) => {
  const selectedRefs = useSubscribe($selectedRefs);

  // Cast to Ref<any, any> for useRefValue - RefOfType is structurally compatible at runtime
  const thread = useRefValue<SerializedCommentThread>(
    threadRef as unknown as Ref<any, any> // todo: fix types
  );
  const repo = useRepo();

  // Get current account's contactUrl
  // todo: we should have a better way to get the contactUrl of the current account
  const [currentAccount] = useDocument<{ contactUrl: AutomergeUrl }>(
    (window as any).accountDocHandle?.url
  );

  // Resolve thread's RefUrls to actual Ref objects for overlap checking
  const resolvedRefs = useResolvedRefs(thread?.refs, repo);

  // Check if this thread is selected (has refs overlapping with selected refs)
  const isSelected = resolvedRefs.some((resolvedRef) =>
    Array.from(selectedRefs).some((selectedRef) =>
      selectedRef.overlaps(resolvedRef)
    )
  );

  if (!thread) {
    return null;
  }

  const { comments } = thread;

  const onResolveThread = () => {
    (threadRef as unknown as Ref<any, any>).change(
      (thread: SerializedCommentThread) => {
        thread.isResolved = true;
      }
    );
  };

  const onSelect = () => {
    onSelectRefs(resolvedRefs);
  };

  const onReplyToComment = () => {
    if (!currentAccount?.contactUrl) return;
    createReply({
      threadRef: threadRef as unknown as Ref<any, any>,
      content: "",
      contactUrl: currentAccount.contactUrl,
    });
  };

  const onDeleteComment = (commentRef: Ref<any, any>) => {
    commentRef.remove();

    // If no comments left, delete the thread
    if (threadRef.value()?.comments.length === 0) {
      threadRef.remove();
    }
  };

  // Find draft comment if any
  const draftComment = comments.find(
    (c) => c.draftContent !== undefined || c.content === undefined
  );
  const draftCommentRef = draftComment
    ? ref(
        threadRef.docHandle,
        "@comments",
        "threads",
        { id: thread.id },
        "comments",
        { id: draftComment.id }
      )
    : null;

  const onSaveDraft = () => {
    if (!draftCommentRef) return;
    (draftCommentRef as Ref<any, any>).change((comment: Comment) => {
      comment.content = comment.draftContent;
      comment.timestamp = Date.now();

      delete comment.draftContent;
    });
  };

  const onCancelDraft = () => {
    if (!draftCommentRef) return;
    const commentValue = draftCommentRef.value() as Comment | undefined;
    if (commentValue?.content === undefined) {
      onDeleteComment(draftCommentRef as Ref<any, any>);
      return;
    }
    (draftCommentRef as Ref<any, any>).change((comment: Comment) => {
      delete comment.draftContent;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`card card-bordered shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow border border-gray-200 ${isSelected ? "border-blue-400 shadow-md" : ""}`}
        onClick={onSelect}
      >
        <div className="card-body p-2 space-y-2">
          {comments.map((comment) => {
            const commentRef = ref(
              threadRef.docHandle,
              "@comments",
              "threads",
              { id: thread.id },
              "comments",
              { id: comment.id }
            );

            return (
              <CommentView
                key={commentRef.url}
                commentRef={commentRef as Ref<any, any>}
                onSelect={onSelect}
                currentContactUrl={currentAccount?.contactUrl}
              />
            );
          })}
        </div>
      </div>
      {isSelected && (
        <div className="flex gap-2 justify-end">
          {draftComment ? (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelDraft();
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveDraft();
                }}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolveThread();
                }}
                title="Resolve comment"
              >
                Resolve
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReplyToComment();
                }}
                title="Reply to comment"
              >
                Reply
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

type CommentViewProps = {
  commentRef: Ref<any, any>;
  onSelect: () => void;
  currentContactUrl?: string;
};

type ContactDoc = { type: "anonymous" } | { type: "registered"; name: string };

const CommentView = ({
  commentRef,
  onSelect,
  currentContactUrl,
}: CommentViewProps) => {
  const comment = useRefValue(commentRef) as Comment | undefined;
  const [contact] = useDocument<ContactDoc>(
    comment?.contactUrl as AutomergeUrl
  );

  if (!comment) {
    return null;
  }

  const { content, timestamp, draftContent } = comment;
  const isDraft = draftContent !== undefined || content === undefined;

  // Hide drafts from other users
  if (isDraft && comment.contactUrl !== currentContactUrl) {
    return null;
  }

  const contactName =
    contact?.type === "registered" ? contact.name : "Anonymous";

  const onChangeDraft = (draftContent: string) => {
    commentRef.change((comment: Comment) => {
      comment.draftContent = draftContent;
    });
  };

  return (
    <div className="space-y-2" data-id={commentRef.url}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <patchwork-view
            doc-url={comment.contactUrl}
            tool-id="contact-avatar"
          />
          <span className="text-sm font-medium whitespace-nowrap">
            {contactName}
          </span>
        </div>
        {!isDraft && timestamp && (
          <span className="text-xs text-gray-400">
            {relativeTime(timestamp)}
          </span>
        )}
      </div>
      {isDraft ? (
        <textarea
          className="textarea w-full min-h-24 border border-gray-300 rounded-lg p-2"
          value={draftContent ?? ""}
          onChange={(e) => onChangeDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onFocus={onSelect}
        />
      ) : (
        <div className="text-base text-gray-800 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
};

const $allActiveThreadRefs = computed(
  globalAnnotations,
  () =>
    new Set(
      Array.from(globalAnnotations.entriesOfType(CommentThread)).map(
        ([, commentAnnotation]) => commentAnnotation.value
      )
    )
);

const $selectedRefs = computed(globalAnnotations, () => {
  return new Set(
    Array.from(globalAnnotations.entriesOfType(IsSelected)).map(
      ([ref, _annotation]) => ref
    )
  );
});

/** Hook to resolve an array of RefUrls to Ref objects */
const useResolvedRefs = (refUrls: RefUrl[] | undefined, repo: Repo): Ref[] => {
  const [resolvedRefs, setResolvedRefs] = useState<Ref[]>([]);

  useEffect(() => {
    if (!refUrls?.length) {
      setResolvedRefs([]);
      return;
    }

    let isCanceled = false;

    Promise.all(
      refUrls.map((url) => findRef(repo, url).catch(() => null))
    ).then((refs) => {
      if (!isCanceled) {
        setResolvedRefs(refs.filter((r): r is Ref => r !== null));
      }
    });

    return () => {
      isCanceled = true;
    };
  }, [refUrls, repo]);

  return resolvedRefs;
};

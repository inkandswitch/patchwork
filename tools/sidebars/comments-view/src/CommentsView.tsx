import "./styles.css";
import { useState, useEffect } from "react";
import Avatar from "boring-avatars";

import { relativeTime } from "@patchwork/util/src/relative-time";
import { toolify } from "@inkandswitch/patchwork-react";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import { IsSelected } from "@inkandswitch/annotations-selection";
import { computed } from "@inkandswitch/observable";
import {
  CommentThread,
  SerializedCommentThread,
  Comment,
  createReply,
} from "@inkandswitch/annotations-comments";
import { useObservable } from "@inkandswitch/observable-react";
import { Ref, RefOfType, ref, fromUrl, RefUrl } from "@patchwork/refs";
import { useRefValue } from "@patchwork/refs-react";
import { Repo } from "@automerge/automerge-repo";

const CommentsView = () => {
  const allActiveThreadRefs = useObservable($allActiveThreadRefs);

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {Array.from(allActiveThreadRefs).map((threadRef) => (
        <ThreadView key={threadRef.toString()} threadRef={threadRef} />
      ))}
    </div>
  );
};

export const renderCommentsView = toolify(CommentsView);

const ThreadView = ({
  threadRef,
}: {
  threadRef: RefOfType<SerializedCommentThread>;
}) => {
  const selectedRefs = useObservable($selectedRefs);

  // Cast to Ref<any, any> for useRefValue - RefOfType is structurally compatible at runtime
  const thread = useRefValue<SerializedCommentThread>(
    threadRef as unknown as Ref<any, any> // todo: fix types
  );
  const repo = useRepo();

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

  const onReplyToComment = async () => {
    createReply({
      threadRef: threadRef as unknown as Ref<any, any>,
      content: "",
      authorId: (await repo.storageId())!,
    });
  };

  const onDeleteComment = (commentRef: Ref<any, any>) => {
    // Delete the comment by splicing it from the array
    const commentValue = commentRef.value() as Comment | undefined;
    if (!commentValue) return;

    // Cast threadRef to use the change method
    (threadRef as unknown as Ref<any, any>).change(
      (t: SerializedCommentThread) => {
        const idx = t.comments.findIndex((c) => c.id === commentValue.id);
        if (idx !== -1) {
          t.comments.splice(idx, 1);
        }
      }
    );

    // If no comments left, delete the thread
    if (threadRef.value()?.comments.length === 0) {
      // todo: we should actually delete the thread from the parent doc
      // but currently we don't have a method to delete an object through a ref
      threadRef.change((thread: SerializedCommentThread) => {
        thread.isResolved = true;
      });
    }
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
                onDeleteComment={() =>
                  onDeleteComment(commentRef as Ref<any, any>)
                }
              />
            );
          })}
        </div>
      </div>
      {isSelected && (
        <div className="flex gap-2 justify-end">
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
        </div>
      )}
    </div>
  );
};

type CommentViewProps = {
  commentRef: Ref<any, any>;
  onDeleteComment: () => void;
};

const CommentView = ({ commentRef, onDeleteComment }: CommentViewProps) => {
  const comment = useRefValue(commentRef) as Comment | undefined;

  if (!comment) {
    return null;
  }

  const { content, timestamp, draftContent } = comment;
  const isDraft = draftContent || content === undefined;

  const onSaveComment = (commentRef: Ref<any, any>) => {
    commentRef.change((comment: Comment) => {
      comment.content = comment.draftContent;
      delete comment.draftContent;
      comment.timestamp = Date.now();
    });
  };

  const onCancelDraft = (commentRef: Ref<any, any>) => {
    if (commentRef.value()?.content === undefined) {
      onDeleteComment();
      return;
    }

    commentRef.change((comment: Comment) => {
      delete comment.draftContent;
    });
  };

  const onChangeDraft = (commentRef: Ref<any, any>, draftContent: string) => {
    commentRef.change((comment: Comment) => {
      comment.draftContent = draftContent;
    });
  };

  return (
    <div className="space-y-2" data-id={commentRef.url}>
      {!isDraft && (
        <div className="flex justify-between">
          <Avatar size={20} name={comment.authorId} />
          <span className="text-xs text-gray-400">
            {relativeTime(timestamp)}
          </span>
        </div>
      )}
      {/* Content or textarea */}
      {isDraft ? (
        <div className="space-y-2">
          <textarea
            className="textarea textarea-bordered w-full min-h-24"
            value={draftContent ?? ""}
            onChange={(e) => onChangeDraft(commentRef, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onSaveComment(commentRef);
              }}
            >
              Save
            </button>
            <button
              className="btn btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancelDraft(commentRef);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
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
      refUrls.map((url) => fromUrl(repo, url).catch(() => null))
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

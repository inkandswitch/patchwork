import "./styles.css";
import { IdRef, loadRef, Ref } from "@patchwork/context";
import type { Comment, Thread } from "@patchwork/context-comments";
import { $allActiveThreadRefs, createReply } from "@patchwork/context-comments";
import {
  useReactive,
  useRefValue,
  useSubcontext,
} from "@patchwork/context-react";
import { useEffect, useMemo, useState } from "react";
import Avatar from "boring-avatars";

import { IsSelected } from "@patchwork/context-selection";
import { relativeTime } from "@patchwork/util/src/relative-time";
import { toolify } from "@patchwork/react";
import { useRepo } from "@automerge/automerge-repo-react-hooks";

const CommentsView = () => {
  const allThreadRefs = useReactive($allActiveThreadRefs) as Ref<Thread>[];

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const selectedThreadRef = useMemo(() => {
    return allThreadRefs.find(
      (threadRef) => threadRef.value?.id === selectedThreadId
    );
  }, [allThreadRefs, selectedThreadId]);

  const selectedThread = useRefValue(selectedThreadRef);

  const selectionContext = useSubcontext("COMMENTS_VIEW_SELECTION");
  useEffect(() => {
    if (!selectedThreadRef || !selectedThread) {
      selectionContext.replace([]);
      return;
    }

    const highlightedRefs = selectedThread.refs.map((ref) =>
      loadRef(selectedThreadRef?.docHandle, ref).with(IsSelected(true))
    );

    selectionContext.replace(highlightedRefs);
  }, [selectedThread, selectedThreadRef, selectionContext]);

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      {allThreadRefs.map((threadRef, index) => (
        <ThreadView
          key={threadRef.toId()}
          index={index}
          threadRef={threadRef}
          isSelected={threadRef.value?.id === selectedThreadId}
          onSelect={() => setSelectedThreadId(threadRef.value?.id)}
        />
      ))}
    </div>
  );
};

export const renderCommentsView = toolify(CommentsView);

const ThreadView = ({
  threadRef,
  index,
  isSelected,
  onSelect,
}: {
  threadRef: Ref<Thread>;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const thread = useRefValue(threadRef);
  const repo = useRepo();

  if (!thread) {
    return null;
  }

  const { comments } = thread;

  const onResolveThread = () => {
    threadRef.change((thread) => {
      thread.isResolved = true;
    });
  };

  const onReplyToComment = async () => {
    createReply({
      threadRef,
      content: "",
      authorId: (await repo.storageId())!,
    });
  };

  const onDeleteComment = (commentRef: Ref<Comment>) => {
    commentRef.destroy();

    if (threadRef.value.comments.length === 0) {
      threadRef.destroy();
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
            const commentRef = new IdRef(
              threadRef.docHandle,
              ["@comments", "threads", index, "comments"],
              comment.id,
              "id"
            );

            return (
              <CommentView
                key={commentRef.toId()}
                commentRef={commentRef as Ref<Comment>}
                onDeleteComment={() =>
                  onDeleteComment(commentRef as Ref<Comment>)
                }
              />
            );
          })}
        </div>
      </div>
      {isSelected && (
        <div className="flex gap-2 justify-end">
          {/* <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onResolveThread();
            }}
            title="Resolve comment"
          >
            Resolve
          </button> */}
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
  commentRef: Ref<Comment>;
  onDeleteComment: () => void;
};

const CommentView = ({ commentRef, onDeleteComment }: CommentViewProps) => {
  const comment = useRefValue(commentRef);

  if (!comment) {
    return null;
  }

  const { content, timestamp, draftContent } = comment;
  const isDraft = draftContent || content === undefined;

  const onSaveComment = (commentRef: Ref<Comment>) => {
    commentRef.change((comment) => {
      comment.content = comment.draftContent;
      delete comment.draftContent;
      comment.timestamp = Date.now();
    });
  };

  const onCancelDraft = (commentRef: Ref<Comment>) => {
    if (commentRef.value.content === undefined) {
      onDeleteComment();
      return;
    }

    commentRef.change((comment) => {
      delete comment.draftContent;
    });
  };

  const onChangeDraft = (commentRef: Ref<Comment>, draftContent: string) => {
    commentRef.change((comment) => {
      comment.draftContent = draftContent;
    });
  };

  return (
    <div className="space-y-2" data-id={commentRef.toId()}>
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
            className="textarea textarea-bordered w-full min-h-[6rem]"
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

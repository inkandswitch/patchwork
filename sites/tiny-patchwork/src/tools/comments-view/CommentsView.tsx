import { AutomergeUrl } from "@automerge/automerge-repo";
import { CONTEXT, contextComputation, Ref, RefWith } from "@patchwork/context";
import { Comments } from "@patchwork/context/comments";
import { useReactive } from "@patchwork/context/react";

import { Comment } from "@patchwork/context/comments";
import { relativeTime } from "../../lib/relative-time";
import { toolify } from "../../lib/toolify";
import { useTitle } from "../../lib/datatype-hooks";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { HasPatchworkMetadata } from "@patchwork/filesystem";

const CommentsView = () => {
  const documentsWithComments = useReactive($documentsWithComments);

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      <h2 className="text-md font-bold">Comments</h2>

      {documentsWithComments.map(({ docUrl, refsWithComments }) => (
        <DocCommentsView
          docUrl={docUrl}
          refsWithComments={refsWithComments}
          showTitle={documentsWithComments.length > 1}
        />
      ))}
    </div>
  );
};

const DocCommentsView = ({
  docUrl,
  refsWithComments,
  showTitle = false,
}: {
  docUrl: AutomergeUrl;
  refsWithComments: RefWith<Comments>[];
  showTitle?: boolean;
}) => {
  const repo = useRepo();
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl, { suspense: true });
  const title = useTitle(doc, repo);

  return (
    <div className="flex flex-col gap-2">
      {showTitle && (
        <h3 className="text-sm font-bold text-gray-400">{title}</h3>
      )}
      {refsWithComments.map((refWithComments) => (
        <CommentThread
          key={refWithComments.toId()}
          refWithComments={refWithComments}
        />
      ))}
    </div>
  );
};

const CommentThread = ({
  refWithComments,
}: {
  refWithComments: RefWith<Comments>;
}) => {
  const commentRefs = [refWithComments.get(Comments)]; // todo: make comments a multi value field

  const onSaveComment = (commentRef: Ref<Comment>) => {
    commentRef.change((comment) => {
      comment.content = comment.draftContent;
      delete comment.draftContent;
      comment.timestamp = Date.now();
    });
  };

  const onCancelDraft = (commentRef: Ref<Comment>) => {
    if (commentRef.value.content === undefined) {
      commentRef.destroy();
      return;
    }

    commentRef.change((comment) => {
      delete comment.draftContent;
    });
  };

  const onUpdateDraft = (commentRef: Ref<Comment>, draftContent: string) => {
    commentRef.change((comment) => {
      comment.draftContent = draftContent;
    });
  };

  return (
    <div>
      <div className="space-y-4">
        {commentRefs.map((commentRef) => {
          if (!commentRef.value) {
            return null;
          }

          const { content, timestamp, draftContent } = commentRef.value;

          const isDraft = draftContent || content === undefined;

          return (
            <div
              key={commentRef.toId()}
              className="card card-bordered shadow-sm bg-white"
            >
              <div className="card-body p-2 space-y-2">
                {/* Metadata line: relative timestamp */}
                {!isDraft && (
                  <div className="flex items-center justify-end">
                    {/* TODO: display author */}
                    <span className="text-xs text-gray-400">
                      {relativeTime(timestamp)}
                    </span>
                  </div>
                )}
                {/* Content or textarea */}
                {isDraft ? (
                  <textarea
                    className="textarea textarea-bordered w-full min-h-[4rem]"
                    placeholder="Write your comment..."
                    value={draftContent ?? ""}
                    onChange={(e) => onUpdateDraft(commentRef, e.target.value)}
                  />
                ) : (
                  <p className="text-base text-gray-800">{content}</p>
                )}
                {/* Save button for draft */}

                {isDraft && (
                  <div className="flex justify-end">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onCancelDraft(commentRef)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onSaveComment(commentRef)}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type DocumentWithComments = {
  docUrl: AutomergeUrl;
  refsWithComments: RefWith<Comments>[];
};

const $documentsWithComments = contextComputation(
  (context): DocumentWithComments[] => {
    const refsWithComments = context.refsWith(Comments);

    return Object.entries(
      Object.groupBy(refsWithComments, (ref) => ref.docUrl)
    ).map(([docUrl, comments]) => ({
      docUrl: docUrl as AutomergeUrl,
      refsWithComments: comments as RefWith<Comments>[],
    }));
  }
);

export const renderHistoryView = toolify(CommentsView);

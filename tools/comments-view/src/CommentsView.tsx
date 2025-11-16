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
import type { DocHandle } from "@automerge/automerge-repo";
import { useWebRTCMesh } from "./useWebRTCMesh";

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
      <VideoCall />
    </div>
  );
};

export const renderCommentsView = toolify(CommentsView);

// WebRTC Video Call Component with N-N mesh support
const VideoCall = () => {
  const repo = useRepo();
  const [callDocHandle, setCallDocHandle] = useState<DocHandle<unknown> | null>(
    null
  );
  const [joinUrl, setJoinUrl] = useState("");

  const {
    localStream,
    remoteStreams,
    isInCall,
    error,
    startCall,
    joinCall,
    hangUp,
  } = useWebRTCMesh();

  const handleStartCall = async () => {
    const handle = repo.create();
    await handle.whenReady();
    setCallDocHandle(handle);

    const peerId = repo.peerId;
    await startCall(handle, peerId);
  };

  const handleJoinCall = async (url: string) => {
    const handle = await repo.find(url as any);
    await handle.whenReady();
    setCallDocHandle(handle);

    const peerId = repo.peerId;
    await joinCall(handle, peerId);
  };

  const handleHangUp = () => {
    hangUp();
    setCallDocHandle(null);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Video Call (N-N Mesh 4)</h2>

        {error && (
          <div className="alert alert-error">
            <span className="text-xs">{error.message}</span>
          </div>
        )}

        {!isInCall ? (
          <div className="space-y-4">
            <button
              className="btn btn-primary w-full"
              onClick={handleStartCall}
            >
              Start New Call
            </button>

            <div className="divider">OR</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Join a call</span>
              </label>
              <div className="join">
                <input
                  type="text"
                  placeholder="Paste call URL here"
                  className="input input-bordered join-item flex-1"
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                />
                <button
                  className="btn btn-primary join-item"
                  onClick={() => handleJoinCall(joinUrl)}
                  disabled={!joinUrl}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {callDocHandle?.url && (
              <div className="alert alert-info">
                <div className="flex flex-col gap-2 w-full">
                  <span className="text-xs">
                    Share this URL to invite others:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm flex-1 font-mono text-xs"
                      value={callDocHandle.url}
                      readOnly
                    />
                    <button
                      className="btn btn-sm"
                      onClick={() =>
                        navigator.clipboard.writeText(callDocHandle.url)
                      }
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Local video */}
            <div>
              <p className="text-sm font-semibold mb-2">You</p>
              <div className="relative w-full aspect-video rounded-lg bg-gray-800 overflow-hidden border-2 border-gray-600">
                <video
                  ref={(el) => {
                    if (el && localStream) {
                      el.srcObject = localStream;
                    }
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Remote videos - one per peer */}
            {remoteStreams.size > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  Remote Peers ({remoteStreams.size})
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from(remoteStreams.entries()).map(
                    ([peerId, stream]) => (
                      <div key={peerId}>
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          {peerId}
                        </p>
                        <div className="relative w-full aspect-video rounded-lg bg-gray-800 overflow-hidden border-2 border-gray-600">
                          <video
                            ref={(el) => {
                              if (el) {
                                el.srcObject = stream;
                              }
                            }}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <button className="btn btn-error w-full" onClick={handleHangUp}>
              Hang Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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

  // const _onResolveThread = () => {
  //   threadRef.change((thread) => {
  //     thread.isResolved = true;
  //   });
  // };

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

import "./styles.css";
import { IdRef, loadRef, Ref } from "@patchwork/context";
import type { Comment, Thread } from "@patchwork/context-comments";
import { $allActiveThreadRefs, createReply } from "@patchwork/context-comments";
import {
  useReactive,
  useRefValue,
  useSubcontext,
} from "@patchwork/context-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "boring-avatars";

import { IsSelected } from "@patchwork/context-selection";
import { relativeTime } from "@patchwork/util/src/relative-time";
import { toolify } from "@patchwork/react";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import type { DocHandle } from "@automerge/automerge-repo";

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

// WebRTC Video Call Component
type SignalMessage = {
  type: "offer" | "answer" | "ice-candidate" | "ready";
  payload?: any;
  from: string;
};

type CallDoc = {
  callUrl?: string;
};

const VideoCall = () => {
  const repo = useRepo();
  const [callDocHandle, setCallDocHandle] = useState<DocHandle<CallDoc> | null>(
    null
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [peerId, setPeerId] = useState<string>("");
  const [connectionState, setConnectionState] = useState<string>("new");
  const [iceConnectionState, setIceConnectionState] = useState<string>("new");
  const [signalingState, setSignalingState] = useState<string>("stable");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const addLog = useCallback((message: string) => {
    console.log(`[WebRTC] ${message}`);
    setDebugLog((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  // Log when we're in a call
  useEffect(() => {
    if (isInCall) {
      addLog(
        `In call state: localStream=${!!localStream}, remoteStream=${!!remoteStream}`
      );
    }
  }, [isInCall, localStream, remoteStream, addLog]);

  // Display local video
  useEffect(() => {
    // Only try to attach video when we're in a call (video elements are rendered)
    if (!isInCall) return;

    const videoEl = localVideoRef.current;
    if (!videoEl) {
      addLog("No local video element ref (waiting for render)");
      return;
    }

    if (!localStream) {
      return; // Stream not ready yet
    }

    addLog(
      `Setting local video (${localStream.getVideoTracks().length} video, ${localStream.getAudioTracks().length} audio)`
    );
    videoEl.srcObject = localStream;

    // Explicitly play
    videoEl
      .play()
      .then(() => {
        addLog("Local video playing");
      })
      .catch((err) => {
        addLog(`Local video play error: ${err}`);
      });
  }, [isInCall, localStream, addLog]);

  // Display remote video
  useEffect(() => {
    // Only try to attach video when we're in a call (video elements are rendered)
    if (!isInCall) return;

    const videoEl = remoteVideoRef.current;
    if (!videoEl) {
      addLog("No remote video element ref (waiting for render)");
      return;
    }

    if (!remoteStream) {
      return; // Stream not ready yet
    }

    addLog(
      `Setting remote video (${remoteStream.getVideoTracks().length} video, ${remoteStream.getAudioTracks().length} audio)`
    );
    videoEl.srcObject = remoteStream;

    // Explicitly play
    videoEl
      .play()
      .then(() => {
        addLog("Remote video playing");
      })
      .catch((err) => {
        addLog(`Remote video play error: ${err}`);
      });
  }, [isInCall, remoteStream, addLog]);

  // Listen for signaling messages - must be active BEFORE sending any messages
  useEffect(() => {
    if (!callDocHandle) return;

    addLog("Setting up ephemeral message listener");

    const handleMessage = async (event: any) => {
      // Automerge wraps ephemeral messages: { handle, senderId, message }
      const message = event.message as SignalMessage;

      if (!message || !message.type) {
        addLog(`Invalid message structure received`);
        return;
      }

      addLog(`Received ${message.type} from ${message.from}`);

      if (message.from === peerId) {
        addLog("Ignoring own message");
        return; // Ignore own messages
      }

      try {
        if (message.type === "ready") {
          addLog("Remote peer is ready, sending offer");
          const pc = peerConnectionRef.current;
          if (pc && !pc.localDescription) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            addLog("Sending offer to ready peer");
            callDocHandle.broadcast({
              type: "offer",
              payload: offer, // Already a plain object
              from: peerId,
            });
          }
          return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
          addLog("No peer connection yet, ignoring message");
          return;
        }

        if (message.type === "offer") {
          addLog("Processing offer");
          await pc.setRemoteDescription(
            new RTCSessionDescription(message.payload)
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          addLog("Sending answer");

          // Send answer via Automerge ephemeral message
          callDocHandle.broadcast({
            type: "answer",
            payload: answer, // Already a plain object
            from: peerId,
          });
        } else if (message.type === "answer") {
          addLog("Processing answer");
          await pc.setRemoteDescription(
            new RTCSessionDescription(message.payload)
          );
        } else if (message.type === "ice-candidate") {
          addLog("Processing ICE candidate");
          await pc.addIceCandidate(new RTCIceCandidate(message.payload));
        }
      } catch (err) {
        addLog(`Error: ${err}`);
        console.error("Error handling signaling message:", err);
      }
    };

    callDocHandle.on("ephemeral-message", handleMessage);
    addLog("Ephemeral message listener active");

    return () => {
      callDocHandle.off("ephemeral-message", handleMessage);
      addLog("Ephemeral message listener removed");
    };
  }, [callDocHandle, peerId, addLog]);

  const createPeerConnection = (
    stream: MediaStream,
    handle: DocHandle<CallDoc>,
    id: string
  ) => {
    addLog("Creating peer connection");
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      addLog(`Connection state: ${pc.connectionState}`);
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      addLog(`ICE connection state: ${pc.iceConnectionState}`);
      setIceConnectionState(pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      addLog(`Signaling state: ${pc.signalingState}`);
      setSignalingState(pc.signalingState);
    };

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      addLog(`Adding ${track.kind} track`);
      pc.addTrack(track, stream);
    });

    // Handle incoming tracks
    pc.ontrack = (event) => {
      addLog(`Received remote ${event.track.kind} track`);
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addLog("Sending ICE candidate");
        handle.broadcast({
          type: "ice-candidate",
          payload: event.candidate.toJSON(), // Convert to plain object
          from: id,
        });
      } else {
        addLog("ICE gathering complete");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    try {
      addLog("Requesting user media...");
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      addLog(`Got local stream with ${stream.getTracks().length} tracks`);

      // Log track details
      stream.getTracks().forEach((track) => {
        addLog(
          `Track: ${track.kind} - enabled: ${track.enabled} - muted: ${track.muted} - readyState: ${track.readyState}`
        );
      });

      setLocalStream(stream);

      // Create call document
      addLog("Creating call document...");
      const handle = repo.create<CallDoc>();
      await handle.whenReady();
      addLog(`Call document created: ${handle.url}`);

      const id = (await repo.storageId()) || Math.random().toString(36);
      addLog(`My peer ID: ${id}`);

      setCallDocHandle(handle);
      setPeerId(id);

      // Create peer connection (will send offer when joiner signals ready)
      createPeerConnection(stream, handle, id);
      addLog("Waiting for another peer to join...");

      // Store call URL in document for sharing
      handle.change((doc: CallDoc) => {
        doc.callUrl = handle.url;
      });

      setIsInCall(true);
    } catch (err) {
      addLog(`Error starting call: ${err}`);
      console.error("Error starting call:", err);
    }
  };

  const joinCall = async (url: string) => {
    try {
      addLog("Requesting user media...");
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      addLog(`Got local stream with ${stream.getTracks().length} tracks`);

      // Log track details
      stream.getTracks().forEach((track) => {
        addLog(
          `Track: ${track.kind} - enabled: ${track.enabled} - muted: ${track.muted} - readyState: ${track.readyState}`
        );
      });

      setLocalStream(stream);

      // Find the call document
      addLog(`Finding call document: ${url}`);
      const handle = await repo.find<CallDoc>(url as any);
      await handle.whenReady();
      addLog("Call document ready");

      const id = (await repo.storageId()) || Math.random().toString(36);
      addLog(`My peer ID: ${id}`);

      setCallDocHandle(handle);
      setPeerId(id);

      // Create peer connection
      createPeerConnection(stream, handle, id);

      // Signal that we're ready - this will trigger the initiator to send an offer
      addLog("Signaling ready to remote peer");
      handle.broadcast({
        type: "ready",
        from: id,
      });

      setIsInCall(true);
    } catch (err) {
      addLog(`Error joining call: ${err}`);
      console.error("Error joining call:", err);
    }
  };

  const hangUp = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setCallDocHandle(null);
    setIsInCall(false);
  };

  const [joinUrl, setJoinUrl] = useState("");

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Video Call</h2>

        {!isInCall ? (
          <div className="space-y-4">
            <button className="btn btn-primary w-full" onClick={startCall}>
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
                  onClick={() => joinCall(joinUrl)}
                  disabled={!joinUrl}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex gap-2 flex-wrap">
              <div className="badge badge-primary">
                Connection: {connectionState}
              </div>
              <div className="badge badge-secondary">
                ICE: {iceConnectionState}
              </div>
              <div className="badge badge-accent">
                Signaling: {signalingState}
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-2">
                  You{" "}
                  {localStream && `(${localStream.getTracks().length} tracks)`}
                </p>
                <div className="relative w-full aspect-video rounded-lg bg-gray-800 overflow-hidden border-2 border-gray-600">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {!localStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                      No local stream
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">
                  Remote{" "}
                  {remoteStream &&
                    `(${remoteStream.getTracks().length} tracks)`}
                </p>
                <div className="relative w-full aspect-video rounded-lg bg-gray-800 overflow-hidden border-2 border-gray-600">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                      Waiting for remote stream
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Debug Log */}
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                Debug Log ({debugLog.length} messages)
              </div>
              <div className="collapse-content">
                <div className="text-xs font-mono space-y-1 max-h-60 overflow-y-auto">
                  {debugLog.map((log, i) => (
                    <div key={i} className="text-xs">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn btn-error w-full" onClick={hangUp}>
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

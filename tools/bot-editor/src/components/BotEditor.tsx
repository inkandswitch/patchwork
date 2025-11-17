import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { useReactive } from "@patchwork/context-react";
import { $selectedDocUrls } from "@patchwork/context-selection";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { toolify } from "@patchwork/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BotIcon, CheckIcon, SendIcon, XIcon } from "lucide-react";
import Markdown from "react-markdown";
import type { ModelId } from "../providers/types";
import "./styles.css";
import { ModelPicker } from "./ModelPicker";
import { Agent, type ChatDocument, type ChatMessage } from "../Agent";

// Target document type (document being edited)
type TargetDocument = HasPatchworkMetadata & {
  botChatDocUrl?: string;
  botModelId?: ModelId;
};

const BotEditor = () => {
  const selectedDocUrls = useReactive($selectedDocUrls);

  return (
    <div className="flex flex-col h-full">
      {selectedDocUrls.map((url) => (
        <DocBotEditor docUrl={url} key={url} />
      ))}
    </div>
  );
};

const DocBotEditor = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const repo = useRepo();
  const [targetDoc] = useDocument<TargetDocument>(docUrl, {
    suspense: true,
  });
  const [targetHandle, setTargetHandle] =
    useState<DocHandle<TargetDocument> | null>(null);

  useEffect(() => {
    repo.find<TargetDocument>(docUrl).then(setTargetHandle);
  }, [docUrl, repo]);

  if (!targetDoc || !targetHandle) {
    return null;
  }

  return (
    <BotEditorImpl
      targetDoc={targetDoc}
      targetHandle={targetHandle}
      targetDocUrl={docUrl}
    />
  );
};

const BotEditorImpl = ({
  targetDoc,
  targetHandle,
  targetDocUrl,
}: {
  targetDoc: TargetDocument;
  targetHandle: DocHandle<TargetDocument>;
  targetDocUrl: AutomergeUrl;
}) => {
  const repo = useRepo();
  const [pendingMessage, setPendingMessage] = useState("");
  const [chatDocUrl, setChatDocUrl] = useState<AutomergeUrl | null>(
    (targetDoc.botChatDocUrl as AutomergeUrl) || null
  );
  const [chatHandle, setChatHandle] = useState<DocHandle<ChatDocument> | null>(
    null
  );
  const [agent, setAgent] = useState<Agent | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize model ID from document or use default
  const [modelId, setModelId] = useState<ModelId | undefined>(
    targetDoc.botModelId
  );

  // Use useDocument to load chat document directly
  const [chatDoc] = useDocument<ChatDocument>(
    chatDocUrl || ("" as AutomergeUrl)
  );

  // Create or load chat document handle
  useEffect(() => {
    const initChatDoc = async () => {
      if (chatDocUrl) {
        // Load existing chat document handle
        const handle = await repo.find<ChatDocument>(chatDocUrl);
        setChatHandle(handle);
      } else {
        // Create new chat document
        const handle = repo.create<ChatDocument>();
        handle.change((doc) => {
          doc.messages = [];
          doc.targetDocUrl = targetDocUrl;
          if (modelId) {
            doc.modelId = modelId;
          }
        });

        const newChatDocUrl = handle.url;
        setChatDocUrl(newChatDocUrl);
        setChatHandle(handle);

        // Store reference in target document
        targetHandle.change((d) => {
          d.botChatDocUrl = newChatDocUrl;
        });
      }
    };

    initChatDoc();
  }, [chatDocUrl, repo, targetDocUrl, targetHandle, modelId]);

  // Create and start agent
  useEffect(() => {
    if (!chatHandle) {
      return;
    }

    const newAgent = new Agent(chatHandle, repo, modelId);

    newAgent.start();
    setAgent(newAgent);

    return () => {
      newAgent.stop();
    };
  }, [chatHandle, repo, modelId]);

  // Persist model ID changes to target document
  const handleModelChange = useCallback(
    (newModelId: ModelId) => {
      setModelId(newModelId);
      targetHandle.change((d) => {
        d.botModelId = newModelId;
      });

      // Update chat document model
      if (chatHandle) {
        chatHandle.change((d) => {
          if (newModelId) {
            d.modelId = newModelId;
          }
        });
      }
    },
    [targetHandle, chatHandle]
  );

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatDoc?.messages]);

  // Handle sending message
  const handleUserMessage = () => {
    if (!pendingMessage.trim() || !chatHandle) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: "user",
      type: "text",
      content: pendingMessage,
      timestamp: Date.now(),
    };

    chatHandle.change((doc) => {
      if (!doc.messages) doc.messages = [];
      doc.messages.push(userMessage);
    });

    setPendingMessage("");
  };

  // Handle clearing history
  const handleClearHistory = async () => {
    // Delete old chat document and create new one
    const handle = repo.create<ChatDocument>();
    handle.change((doc) => {
      doc.messages = [];
      doc.targetDocUrl = targetDocUrl;
      if (modelId) {
        doc.modelId = modelId;
      }
    });

    const newChatDocUrl = handle.url;
    setChatDocUrl(newChatDocUrl);
    setChatHandle(handle);

    // Update reference in target document
    targetHandle.change((d) => {
      d.botChatDocUrl = newChatDocUrl;
    });
  };

  if (!chatDoc) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="alert">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Check if we're waiting for a response (last message is user message)
  const isWaiting =
    chatDoc.messages.length > 0 &&
    chatDoc.messages[chatDoc.messages.length - 1].role === "user";

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <BotIcon size={16} />
        <span className="font-semibold">Bot Editor</span>
        <div className="flex gap-2 ml-auto">
          <ModelPicker modelId={modelId} onChange={handleModelChange} />
          <button className="btn btn-ghost btn-xs" onClick={handleClearHistory}>
            Clear History
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-2 min-h-0">
        {chatDoc.messages.map((message, index) => {
          if (message.role === "user") {
            return (
              <div key={message.id || index} className="chat chat-end">
                <div className="chat-bubble chat-bubble-neutral bg-base-100 text-base-content text-sm ml-[50px]">
                  <Markdown>{message.content}</Markdown>
                </div>
              </div>
            );
          }

          if (message.type === "thinking") {
            // Don't render if in progress and no content yet
            if (message.inProgress && !message.content) {
              return null;
            }

            return (
              <div key={message.id || index} className="px-2 py-1 text-sm">
                <div className="flex items-center gap-2 text-base-content opacity-70">
                  <span className="font-medium">{message.description}</span>
                  {message.inProgress && (
                    <span className="loading loading-dots loading-xs"></span>
                  )}
                </div>
              </div>
            );
          }

          if (message.type === "action") {
            // Don't render if no actionId yet (incomplete)
            if (!message.actionId) {
              return null;
            }

            const icon =
              message.status === "success" ? (
                "✓"
              ) : message.status === "error" ? (
                "✗"
              ) : (
                <span className="loading loading-dots loading-xs"></span>
              );

            const textColor =
              message.status === "success"
                ? "text-success"
                : message.status === "error"
                  ? "text-error"
                  : "text-warning";

            return (
              <div key={message.id || index} className="px-2 py-1 text-sm">
                <div className={`flex items-center gap-2 ${textColor}`}>
                  <span>{message.description}</span>
                  {icon}
                </div>
                {message.error && (
                  <div className="ml-6 text-xs text-error mt-1">
                    {message.error}
                  </div>
                )}
              </div>
            );
          }

          // Assistant text - plain text, no bubble
          if (message.type === "text") {
            // Don't render empty text messages
            if (!message.content || !message.content.trim()) {
              return null;
            }

            return (
              <div
                key={message.id || index}
                className="chat-bubble chat-bubble-neutral bg-base-100 text-base-content text-sm"
              >
                <Markdown>{message.content}</Markdown>
              </div>
            );
          }

          return null;
        })}
        {isWaiting && (
          <div className="px-2 py-1 text-sm">
            <div className="flex items-center gap-2 text-base-content opacity-70">
              <span className="text-xs">Thinking</span>
              <span className="loading loading-dots loading-xs"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex flex-col gap-2 p-2">
        <div className="relative">
          <textarea
            value={pendingMessage}
            className="textarea textarea-bordered w-full h-20 resize-none"
            onChange={(e) => setPendingMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (pendingMessage.trim()) {
                  handleUserMessage();
                }
              }
            }}
            placeholder="Ask the bot to edit the document..."
            disabled={isWaiting}
          />
          <button
            onClick={handleUserMessage}
            className="btn btn-ghost btn-sm absolute bottom-2 right-2 h-8 w-8 min-h-0 p-0"
            disabled={!pendingMessage.trim() || isWaiting}
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const renderBotEditor = toolify(BotEditor);

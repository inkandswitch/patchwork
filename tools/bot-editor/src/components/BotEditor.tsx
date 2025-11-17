import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { useReactive } from "@patchwork/context-react";
import { $selectedDocUrls } from "@patchwork/context-selection";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { toolify } from "@patchwork/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BotIcon, SendIcon } from "lucide-react";
import Markdown from "react-markdown";
import type { ModelId } from "../providers/types";
import "../styles.css";
import { useLLMProvider } from "../hooks";
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
  const [chatDoc, setChatDoc] = useState<ChatDocument | null>(null);
  const [chatHandle, setChatHandle] = useState<DocHandle<ChatDocument> | null>(
    null
  );
  const [agent, setAgent] = useState<Agent | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize model ID from document or use default
  const [modelId, setModelId] = useState<ModelId | undefined>(
    targetDoc.botModelId
  );

  // Load LLM provider
  const { llmActive, chatCompletionStream } = useLLMProvider(modelId);

  // Create or load chat document
  useEffect(() => {
    const initChatDoc = async () => {
      if (chatDocUrl) {
        // Load existing chat document
        const handle = await repo.find<ChatDocument>(chatDocUrl);
        const doc = handle.docSync();
        setChatHandle(handle);
        setChatDoc(doc || null);
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
        setChatDoc(handle.docSync() || null);

        // Store reference in target document
        targetHandle.change((d) => {
          d.botChatDocUrl = newChatDocUrl;
        });
      }
    };

    initChatDoc();
  }, [chatDocUrl, repo, targetDocUrl, targetHandle, modelId]);

  // Subscribe to chat document changes
  useEffect(() => {
    if (!chatHandle) return;

    const handleChange = () => {
      setChatDoc(chatHandle.docSync() || null);
    };

    chatHandle.on("change", handleChange);
    return () => {
      chatHandle.off("change", handleChange);
    };
  }, [chatHandle]);

  // Create and start agent
  useEffect(() => {
    if (!chatHandle || !targetHandle || !chatCompletionStream) {
      return;
    }

    const newAgent = new Agent(
      chatHandle,
      targetHandle,
      repo,
      chatCompletionStream,
      modelId
    );

    newAgent.start();
    setAgent(newAgent);

    return () => {
      newAgent.stop();
    };
  }, [chatHandle, targetHandle, repo, chatCompletionStream, modelId]);

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

  // Auto-scroll to bottom
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
    setChatDoc(handle.docSync() || null);

    // Update reference in target document
    targetHandle.change((d) => {
      d.botChatDocUrl = newChatDocUrl;
    });
  };

  if (llmActive === false) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="alert alert-warning">
          <span>No LLM provider available.</span>
        </div>
      </div>
    );
  }

  if (llmActive === undefined || !chatDoc) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="alert">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const isProcessing =
    chatDoc.messages.length > 0 &&
    chatDoc.messages[chatDoc.messages.length - 1].role === "assistant" &&
    (!chatDoc.messages[chatDoc.messages.length - 1].content ||
      chatDoc.messages[chatDoc.messages.length - 1].content === "");

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
      <div className="flex-1 overflow-y-auto flex flex-col p-2 min-h-0">
        {chatDoc.messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`chat ${
              message.role === "user" ? "chat-end" : "chat-start"
            }`}
          >
            <div
              className={`chat-bubble text-sm ${
                message.role === "user"
                  ? "chat-bubble-neutral"
                  : "bg-base-200 text-base-content"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="space-y-2">
                  {/* Thinking blocks - collapsed by default */}
                  {message.thinking && message.thinking.length > 0 && (
                    <details className="bg-base-300 rounded p-2">
                      <summary className="cursor-pointer text-xs opacity-70">
                        💭 Thinking...
                      </summary>
                      <div className="mt-2 text-xs space-y-2">
                        {message.thinking.map((thinking, i) => (
                          <div key={i} className="italic opacity-80">
                            <Markdown>{thinking}</Markdown>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Action status indicators */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="space-y-1">
                      {message.actions.map((action, i) => (
                        <div
                          key={i}
                          className={`text-xs px-2 py-1 rounded ${
                            action.status === "success"
                              ? "bg-success bg-opacity-20 text-success"
                              : "bg-error bg-opacity-20 text-error"
                          }`}
                        >
                          {action.status === "success" ? "✓" : "✗"}{" "}
                          {action.actionId}
                          {action.error && (
                            <div className="text-xs opacity-70 mt-1">
                              {action.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main display content */}
                  {message.displayContent && (
                    <Markdown>{message.displayContent}</Markdown>
                  )}

                  {/* Loading indicator for empty assistant messages */}
                  {(!message.displayContent ||
                    message.displayContent === "") && (
                    <div className="flex items-center gap-2">
                      <span className="loading loading-dots loading-xs"></span>
                      <span className="text-xs opacity-70">Thinking...</span>
                    </div>
                  )}
                </div>
              ) : (
                <Markdown>{message.content}</Markdown>
              )}
            </div>
          </div>
        ))}
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
            disabled={isProcessing}
          />
          <button
            onClick={handleUserMessage}
            className="btn btn-ghost btn-sm absolute bottom-2 right-2 h-8 w-8 min-h-0 p-0"
            disabled={!pendingMessage.trim() || isProcessing}
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const renderBotEditor = toolify(BotEditor);

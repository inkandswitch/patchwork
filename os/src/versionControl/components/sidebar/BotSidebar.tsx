import { BotIcon, CheckIcon, EyeIcon, XIcon, SendIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { Button } from "@patchwork/sdk/ui";
import { AutomergeUrl, Doc, DocHandle } from "@automerge/automerge-repo";
import { type DataType } from "@patchwork/sdk";
import {
  AssistantMessage,
  ChatMessage,
  makeBotEdits,
} from "@patchwork/sdk/llm";
import { useToast } from "@patchwork/sdk/ui";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import {
  BranchDoc,
  HasVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import Markdown from "react-markdown";
import { isLLMActive, getDefaultModelId } from "@patchwork/sdk/llm";
import { SidebarMode } from "@patchwork/sdk/router";
import { om } from "@patchwork/sdk/om";
import { ModelId } from "@patchwork/sdk/llm";
import { ModelPicker } from "./ModelPicker";
import { PromptPicker } from "./PromptPicker";
import { useSelectedPrompt } from "./useSelectedPrompt";

// A string which will be visible to the bot representing user acceptance of edits.
// We won't show it to the user because that's weird, we'll just show something in the UI
const ACCEPT_MESSAGE = "Edits accepted.";
const REJECT_MESSAGE = "Edits rejected.";

export const BotSidebar = ({
  doc,
  handle,
  dataType,
  selectedBranchUrl,
  setSelectedBranch,
  setSidebarMode,
  onMergeBranch,
  onDeleteBranch,
  mainDocUrl,
}: {
  doc: Doc<HasVersionControlMetadata<unknown, unknown>>;
  handle: DocHandle<HasVersionControlMetadata<unknown, unknown>>;
  dataType: DataType;
  selectedBranchUrl: AutomergeUrl | undefined;
  setSelectedBranch: (branchUrl: AutomergeUrl | null) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  onMergeBranch: (branchUrl: AutomergeUrl) => void;
  onDeleteBranch: (branchUrl: AutomergeUrl) => void;
  mainDocUrl: AutomergeUrl;
}) => {
  const repo = useRepo();
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Initialize model ID from document or use default
  const [modelId, setModelId] = useState<ModelId | undefined>(doc.botModelId);
  const [llmActive, setLlmActive] = useState<boolean | undefined>(undefined);

  // Check if LLM is active
  useEffect(() => {
    isLLMActive().then(setLlmActive);
  }, []);

  // Set default model ID if none is set
  useEffect(() => {
    if (!modelId) {
      getDefaultModelId().then((defaultId) => {
        if (defaultId) {
          setModelId(defaultId);
        }
      });
    }
  }, [modelId]);

  const { currentPrompt, handlePromptChange, prompts } =
    useSelectedPrompt(dataType);

  // Initialize prompt from document if present
  useEffect(() => {
    if (doc.botPromptId && prompts.length > 0) {
      const savedPrompt = prompts.find((p) => p.id === doc.botPromptId);
      if (savedPrompt) {
        handlePromptChange(doc.botPromptId);
      }
    }
  }, [doc.botPromptId, prompts, handlePromptChange]);

  // Persist model ID changes to document
  const handleModelChange = (newModelId: ModelId) => {
    setModelId(newModelId);
    console.log("handleModelChange", newModelId);
    handle.change((d) => {
      d.botModelId = newModelId;
    });
  };

  // Persist prompt ID changes to document
  const handlePromptChangeWithPersistence = (promptId: string) => {
    handlePromptChange(promptId);
    handle.change((d) => {
      d.botPromptId = promptId;
    });
  };

  useEffect(() => {
    if (!doc.botChatHistory) {
      handle.change((d) => (d.botChatHistory = []));
    }
  }, [doc.botChatHistory, handle]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [doc.botChatHistory, loading]);

  const handleUserMessage = async () => {
    // Don't submit if message is empty
    if (!pendingMessage.trim()) {
      return;
    }

    const newMessage: ChatMessage = {
      role: "user",
      content: pendingMessage,
    };

    handle.change((d) => {
      d.botChatHistory.push(newMessage);
    });

    setPendingMessage("");
    setLoading(true);
    try {
      const branchUrl = await makeBotEdits({
        repo,
        targetDocHandle: handle,
        chatHistory: [...doc.botChatHistory, newMessage],
        dataType,
        modelId,
        promptId: currentPrompt?.id,
      });

      if (branchUrl) {
        setSelectedBranch(branchUrl);
      }
    } catch (e) {
      toast({ title: "Error performing edit", variant: "destructive" });
      console.error(e);
    }
    setLoading(false);
  };

  if (!doc.botChatHistory) {
    return null;
  }

  const lastAssistantMessage = doc.botChatHistory
    .slice()
    .reverse()
    .find((msg) => msg.role === "assistant") as AssistantMessage;
  const showAcceptRejectButtons =
    lastAssistantMessage?.branchUrl &&
    selectedBranchUrl === lastAssistantMessage?.branchUrl;

  const acceptSuggestion = async () => {
    console.log("acceptSuggestion", selectedBranchUrl);
    handle.change((d) => {
      d.botChatHistory.push({
        role: "user",
        content: ACCEPT_MESSAGE,
      });
    });
    const branchOm = await om<BranchDoc>(selectedBranchUrl!, repo);
    onMergeBranch(branchOm.url);
  };
  const rejectSuggestion = async () => {
    handle.change((d) => {
      d.botChatHistory.push({
        role: "user",
        content: REJECT_MESSAGE,
      });
    });

    // need to also do the update on the main doc because we're not merging the branch...
    const mainDocHandle =
      await repo.find<HasVersionControlMetadata<unknown, unknown>>(mainDocUrl);
    mainDocHandle.change((d) => {
      d.botChatHistory.push({
        role: "user",
        content: REJECT_MESSAGE,
      });
    });

    const branchOm = await om<BranchDoc>(selectedBranchUrl!, repo);
    onDeleteBranch(branchOm.url);
  };
  const reviewSuggestion = () => {
    setSidebarMode("review");
  };

  if (llmActive === false) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <p className="text-sm text-gray-500">
          AI edits are disabled because OpenAI API key is not present. See
          README for details.
        </p>
      </div>
    );
  }

  if (llmActive === undefined) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <BotIcon size={16} />
        <span>Bot Editor</span>
        <div className="flex gap-2 ml-auto">
          <button
            className="ml-auto text-gray-500 text-xs rounded hover:bg-gray-300"
            onClick={() =>
              handle.change((d) => {
                d.botChatHistory = [];
              })
            }
          >
            Clear History
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto mb-2 flex flex-col">
        {doc.botChatHistory.map((message, index) => {
          if (
            message.role === "user" &&
            (message.content === ACCEPT_MESSAGE ||
              message.content === REJECT_MESSAGE)
          ) {
            return (
              <div
                key={index}
                className="text-sm text-gray-500 w-auto inline-block self-end mr-2"
              >
                {message.content === ACCEPT_MESSAGE && (
                  <div className="flex items-center gap-2">
                    <CheckIcon size={16} />
                    Accepted
                  </div>
                )}
                {message.content === REJECT_MESSAGE && (
                  <div className="flex items-center gap-2">
                    <XIcon size={16} />
                    Rejected
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`relative p-2 m-2 text-sm font-systemSans rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white ml-auto w-2/3"
                  : "bg-gray-300 text-black mr-auto w-2/3"
              }`}
            >
              <Markdown>{message.content}</Markdown>
            </div>
          );
        })}
        {loading && (
          <div className="mt-2 text-sm text-gray-500">Loading...</div>
        )}
        {showAcceptRejectButtons && (
          <div className="flex items-center gap-2 px-2">
            <Button variant="default" onClick={acceptSuggestion}>
              <CheckIcon size={16} className="mr-2" />
              Accept
            </Button>
            <Button variant="default" onClick={rejectSuggestion}>
              <XIcon size={16} className="mr-2" />
              Reject
            </Button>
            <Button variant="ghost" onClick={reviewSuggestion}>
              <EyeIcon size={16} className="mr-2" />
              Review
            </Button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="flex flex-col gap-2 border-t pt-2">
        <div className="relative">
          <textarea
            value={pendingMessage}
            className="w-full p-2 border border-gray-300 rounded h-32 resize-none"
            onChange={(e) => setPendingMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                // Only submit if message is not empty
                if (pendingMessage.trim()) {
                  handleUserMessage();
                }
              }
            }}
            placeholder="Make it more X..."
          />
          <Button
            onClick={handleUserMessage}
            className="absolute bottom-2 right-2 h-8 w-8 p-0"
            variant="ghost"
            disabled={!pendingMessage.trim() || loading}
          >
            <SendIcon size={16} />
          </Button>
        </div>
        <div className="flex gap-3 justify-start">
          <PromptPicker
            prompts={prompts}
            currentPrompt={currentPrompt}
            onChange={handlePromptChangeWithPersistence}
          />
          {modelId && (
            <ModelPicker modelId={modelId} onChange={handleModelChange} />
          )}
        </div>
      </div>
    </div>
  );
};

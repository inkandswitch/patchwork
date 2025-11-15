import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { useReactive } from "@patchwork/context-react";
import { $selectedDocUrls } from "@patchwork/context-selection";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { toolify } from "@patchwork/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ModelId } from "../providers/types";
import "../styles.css";
import { useLLMProvider, useSelectedPrompt, type AIEditPrompt } from "../hooks";
import { BotEditorHeader } from "./BotEditorHeader";
import { ChatHistory } from "./ChatHistory";
import { ExecutionStatus } from "./ExecutionStatus";
import { ChatInput } from "./ChatInput";
import { PromptPicker } from "./PromptPicker";
import { ModelPicker } from "./ModelPicker";

// Chat message types
type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Document type with bot fields
type BotDocument = HasPatchworkMetadata & {
  botChatHistory?: ChatMessage[];
  botModelId?: ModelId;
  botPromptId?: string;
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
  const [doc] = useDocument<BotDocument>(docUrl, {
    suspense: true,
  });

  const [handle, setHandle] = useState<DocHandle<BotDocument> | null>(null);

  useEffect(() => {
    repo.find<BotDocument>(docUrl).then(setHandle);
  }, [docUrl, repo]);

  if (!doc || !handle) {
    return null;
  }

  const dataTypeId = doc["@patchwork"]?.type;

  return (
    <BotEditorImpl
      doc={doc}
      handle={handle}
      dataTypeId={dataTypeId}
      mainDocUrl={docUrl}
    />
  );
};

const BotEditorImpl = ({
  doc,
  handle,
  dataTypeId,
  mainDocUrl,
}: {
  doc: BotDocument;
  handle: DocHandle<BotDocument>;
  dataTypeId: string | undefined;
  mainDocUrl: AutomergeUrl;
}) => {
  const repo = useRepo();
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize model ID from document or use default
  const [modelId, setModelId] = useState<ModelId | undefined>(doc.botModelId);

  // Multi-step execution state
  const [executionState, setExecutionState] = useState<
    "idle" | "planning" | "executing"
  >("idle");
  const [executionPlan, setExecutionPlan] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [shouldStop, setShouldStop] = useState(false);
  const shouldStopRef = useRef(false);

  // Load LLM provider
  const { llmActive, chatCompletion } = useLLMProvider(modelId);

  // Set default model if provider loaded one
  useEffect(() => {
    if (llmActive && !modelId && chatCompletion) {
      // Provider loaded successfully, keep the current model
    }
  }, [llmActive, modelId, chatCompletion]);

  const dataType = dataTypeId
    ? { id: dataTypeId, name: dataTypeId }
    : undefined;

  const { currentPrompt, handlePromptChange, prompts } = useSelectedPrompt(
    dataType
  ) as {
    currentPrompt: AIEditPrompt | undefined;
    handlePromptChange: (promptId: string) => void;
    prompts: AIEditPrompt[];
  };

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
  const handleModelChange = useCallback(
    (newModelId: ModelId) => {
      setModelId(newModelId);
      handle.change((d) => {
        d.botModelId = newModelId;
      });
    },
    [handle]
  );

  // Persist prompt ID changes to document
  const handlePromptChangeWithPersistence = useCallback(
    (promptId: string) => {
      handlePromptChange(promptId);
      handle.change((d) => {
        d.botPromptId = promptId;
      });
    },
    [handlePromptChange, handle]
  );

  // Initialize chat history
  useEffect(() => {
    if (!doc.botChatHistory) {
      handle.change((d) => {
        d.botChatHistory = [];
      });
    }
  }, [doc.botChatHistory, handle]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [doc.botChatHistory, loading, executionPlan, currentStepIndex]);

  // Update ref when shouldStop changes
  useEffect(() => {
    shouldStopRef.current = shouldStop;
  }, [shouldStop]);

  // Helper to parse edit XML
  const parseEditXML = (xml: string) => {
    const match = xml.match(/<edit>([\s\S]*?)<\/edit>/);
    if (!match) {
      throw new Error("Invalid edit XML format");
    }
    return match[1].trim();
  };

  // Apply edits directly to document
  const applyEditDirectly = async (step: string) => {
    if (!chatCompletion) {
      throw new Error("No LLM provider available");
    }

    // Ensure we have a loaded plugin with module
    if (!currentPrompt || !("module" in currentPrompt)) {
      throw new Error("No AI prompt available");
    }

    const prompt = currentPrompt.module;

    if (!prompt || !dataType) {
      throw new Error("No AI prompt available");
    }

    // Convert the document to text using the prompt's converter
    const docText =
      prompt.docToText?.(handle.doc()) ?? JSON.stringify(handle.doc(), null, 2);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: prompt.prompt,
      },
      ...(handle.doc().botChatHistory || []),
      {
        role: "user",
        content: `Current document contents:
${docText}

${step}`,
      },
    ];

    const response = await chatCompletion(messages, { model: modelId });

    // Strip any edits out of the response for the purposes of chat history
    const cleanedResponse = response.replace(
      /<edit>[\s\S]*?<\/edit>/g,
      () => ``
    );

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: cleanedResponse,
    };

    // Store the message in chat history
    handle.change((d) => {
      if (!d.botChatHistory) d.botChatHistory = [];
      d.botChatHistory.push(assistantMessage);
    });

    // Check if response contains an edit
    if (!response.includes("<edit>")) {
      return;
    }

    try {
      const editText = parseEditXML(response);
      const newContent = prompt.textToDoc?.(editText) ?? JSON.parse(editText);

      // Apply the edit directly to the document
      await prompt.edit(handle, newContent, repo);
    } catch (e) {
      console.error("Failed to process edit:", e);
      throw e;
    }
  };

  // Create execution plan from user request
  const createPlan = async (userRequest: string): Promise<string[]> => {
    if (!chatCompletion) {
      throw new Error("No LLM provider available");
    }

    const planningPrompt = `You are helping plan a multi-step document editing task. Break down the following request into concrete, sequential steps.

User request: "${userRequest}"

Respond with ONLY a numbered list of steps, one per line. Each step should be a clear, actionable edit instruction. Keep steps concise and specific. If the task is simple and can be done in one step, just return one step.

Example format:
1. Add a new section for introduction
2. Update the title to be more descriptive
3. Fix grammar errors in the first paragraph`;

    const response = await chatCompletion(
      [
        {
          role: "user",
          content: planningPrompt,
        },
      ],
      { model: modelId }
    );

    // Parse the numbered list
    const steps = response
      .split("\n")
      .filter((line) => /^\d+\./.test(line.trim()))
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((step) => step.length > 0);

    return steps.length > 0 ? steps : [userRequest];
  };

  // Execute a single step
  const executeStep = async (step: string) => {
    const stepMessage: ChatMessage = {
      role: "user",
      content: step,
    };

    // Add to chat history
    handle.change((d) => {
      if (!d.botChatHistory) d.botChatHistory = [];
      d.botChatHistory.push(stepMessage);
    });

    // Apply edit directly
    await applyEditDirectly(step);
  };

  // Main handler with planning and execution
  const handleUserMessage = async () => {
    // Don't submit if message is empty
    if (!pendingMessage.trim()) {
      return;
    }

    const userRequest = pendingMessage;
    setPendingMessage("");

    const newMessage: ChatMessage = {
      role: "user",
      content: userRequest,
    };

    handle.change((d) => {
      if (!d.botChatHistory) d.botChatHistory = [];
      d.botChatHistory.push(newMessage);
    });

    setLoading(true);
    setShouldStop(false);
    shouldStopRef.current = false;

    try {
      // Planning phase
      setExecutionState("planning");
      const plan = await createPlan(userRequest);
      setExecutionPlan(plan);
      setCurrentStepIndex(0);

      // Show the plan to the user
      const planMessage: ChatMessage = {
        role: "assistant",
        content: `I'll complete this in ${plan.length} step${
          plan.length > 1 ? "s" : ""
        }:\n${plan.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
      };
      handle.change((d) => {
        if (!d.botChatHistory) d.botChatHistory = [];
        d.botChatHistory.push(planMessage);
      });

      // Execution phase
      setExecutionState("executing");

      // Execute steps one by one
      for (let i = 0; i < plan.length; i++) {
        if (shouldStopRef.current) {
          const stopMessage: ChatMessage = {
            role: "assistant",
            content: `Execution stopped at step ${i + 1} of ${plan.length}.`,
          };
          handle.change((d) => {
            if (!d.botChatHistory) d.botChatHistory = [];
            d.botChatHistory.push(stopMessage);
          });
          break;
        }

        setCurrentStepIndex(i);
        await executeStep(plan[i]);
      }

      if (!shouldStopRef.current) {
        const completeMessage: ChatMessage = {
          role: "assistant",
          content: `✓ Completed all ${plan.length} steps.`,
        };
        handle.change((d) => {
          if (!d.botChatHistory) d.botChatHistory = [];
          d.botChatHistory.push(completeMessage);
        });
      }
    } catch (e) {
      console.error("Error during execution:", e);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
      };
      handle.change((d) => {
        if (!d.botChatHistory) d.botChatHistory = [];
        d.botChatHistory.push(errorMessage);
      });
    } finally {
      setLoading(false);
      setExecutionState("idle");
      setExecutionPlan([]);
      setCurrentStepIndex(0);
      setShouldStop(false);
      shouldStopRef.current = false;
    }
  };

  const stopExecution = () => {
    setShouldStop(true);
    shouldStopRef.current = true;
  };

  if (!doc.botChatHistory) {
    return null;
  }

  if (llmActive === false) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="alert alert-warning">
          <span>No LLM provider available.</span>
        </div>
      </div>
    );
  }

  if (llmActive === undefined) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="alert">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <BotEditorHeader
        onClearHistory={() =>
          handle.change((d) => {
            d.botChatHistory = [];
          })
        }
      />
      {/* Conversation history - fills available space */}
      <div className="flex-1 overflow-y-auto flex flex-col p-2 min-h-0">
        <ChatHistory messages={doc.botChatHistory} />
        <ExecutionStatus
          executionState={executionState}
          currentStepIndex={currentStepIndex}
          executionPlan={executionPlan}
          loading={loading}
          onStop={stopExecution}
        />
        <div ref={chatEndRef} />
      </div>
      <div className="flex flex-col gap-2 p-2">
        <ChatInput
          value={pendingMessage}
          onChange={setPendingMessage}
          onSend={handleUserMessage}
          disabled={loading}
        />
        <div className="flex gap-3 justify-start">
          <PromptPicker
            prompts={prompts}
            currentPrompt={currentPrompt}
            onChange={handlePromptChangeWithPersistence}
          />
          <ModelPicker modelId={modelId} onChange={handleModelChange} />
        </div>
      </div>
    </div>
  );
};

export const renderBotEditor = toolify(BotEditor);

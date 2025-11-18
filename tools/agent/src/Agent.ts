import { DocHandle, Repo, AutomergeUrl } from "@automerge/automerge-repo";
import * as Automerge from "@automerge/automerge";
import {
  getRegistry,
  isLoadablePlugin,
  isLoadedPlugin,
} from "@patchwork/plugins";
import type {
  ModelId,
  LLMProviderDescription,
  LoadedLLMProvider,
  LLMProviderImplementation,
} from "./providers/types";

import type {
  ChatDocument,
  AgentTextMessage,
  AgentThinkingMessage,
  AgentActionMessage,
  ChatMessage,
} from "../../chat/src/types";

// Agent document schema
export type AgentDocument = {
  chatDocUrl: AutomergeUrl;
  modelId?: string;
  activeDocUrls: AutomergeUrl[]; // Track documents that have been interacted with
};

type LLMMessage = {
  role: string;
  content: string;
};

// Main step function
export async function step(
  agentDocUrl: AutomergeUrl,
  repo: Repo
): Promise<void> {
  const agentDocHandle = await repo.find<AgentDocument>(agentDocUrl);
  const { chatDocUrl, modelId, activeDocUrls } = agentDocHandle.doc();

  // Load chat document
  const chatDocHandle = await repo.find<ChatDocument>(chatDocUrl);
  const chatDoc = chatDocHandle.doc();

  // Load LLM provider
  const llmProvider = await loadLLMProvider(modelId);
  if (!llmProvider) {
    console.error("Failed to load LLM provider");
    return;
  }

  // Load plugins for these documents
  const actionsByDatatype = await loadActionsByDatatype(activeDocUrls, repo);

  // Build message history for LLM
  const systemPrompt = getSystemPrompt();
  const documentContext = await getDocumentContext(
    activeDocUrls,
    repo,
    actionsByDatatype
  );

  // Build message history from our message types
  const llmMessages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...buildLLMHistory(chatDoc.messages),
  ];

  // Stream response with incremental parsing
  let buffer = "";
  let currentTextMessageId: string | null = null;
  let currentTextContent = "";

  for await (const chunk of llmProvider.chatCompletionStream(llmMessages, {
    model: modelId,
  })) {
    buffer += chunk;

    // Try to parse complete blocks
    const parseResult = parseIncrementalBlocks(buffer);

    // Process incomplete thinking block (create or update)
    if (parseResult.incompleteThinking) {
      const messages = chatDocHandle.doc()?.messages || [];
      let existing: AgentThinkingMessage | undefined;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (
          m.role === "assistant" &&
          m.type === "thinking" &&
          (m as AgentThinkingMessage).description ===
            parseResult.incompleteThinking.description
        ) {
          existing = m as AgentThinkingMessage;
          break;
        }
      }

      if (existing) {
        // Update existing thinking
        chatDocHandle.change((doc) => {
          const msg = doc.messages?.find(
            (m) => m.id === existing!.id
          ) as AgentThinkingMessage;
          if (msg && msg.type === "thinking") {
            msg.content = parseResult.incompleteThinking!.content;
          }
        });
      } else {
        // Create new in-progress thinking
        chatDocHandle.change((doc) => {
          if (!doc.messages) doc.messages = [];
          doc.messages.push({
            id: `msg-${Date.now()}-${Math.random()}`,
            role: "assistant",
            type: "thinking",
            description: parseResult.incompleteThinking!.description,
            content: parseResult.incompleteThinking!.content,
            inProgress: true,
            timestamp: Date.now(),
          } as AgentThinkingMessage);
        });
      }
    }

    // Mark complete thinking blocks as done
    for (const thinking of parseResult.completeThinking) {
      const messages = chatDocHandle.doc()?.messages || [];
      let existing: AgentThinkingMessage | undefined;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (
          m.role === "assistant" &&
          m.type === "thinking" &&
          (m as AgentThinkingMessage).description === thinking.description
        ) {
          existing = m as AgentThinkingMessage;
          break;
        }
      }

      if (existing) {
        // Update to complete
        chatDocHandle.change((doc) => {
          const msg = doc.messages?.find(
            (m) => m.id === existing!.id
          ) as AgentThinkingMessage;
          if (msg && msg.type === "thinking") {
            msg.content = thinking.content;
            msg.inProgress = false;
          }
        });
      }
    }

    // Process complete action blocks (create and execute)
    for (const actionBlock of parseResult.completeActions) {
      try {
        const { description, action } = JSON.parse(actionBlock.json);

        // Filter out undefined values from args (Automerge doesn't allow undefined)
        const cleanArgs: Record<string, any> = {};
        if (action.args && typeof action.args === "object") {
          for (const [key, value] of Object.entries(action.args)) {
            if (value !== undefined) {
              cleanArgs[key] = value;
            }
          }
        }

        const messages = chatDocHandle.doc()?.messages || [];
        let existing: AgentActionMessage | undefined;
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i];
          if (
            m.role === "assistant" &&
            m.type === "action" &&
            (m as AgentActionMessage).description === description
          ) {
            existing = m as AgentActionMessage;
            break;
          }
        }

        if (!existing) {
          // Create new action message with complete data
          const actionMessageId = `msg-${Date.now()}-${Math.random()}`;
          chatDocHandle.change((doc) => {
            if (!doc.messages) doc.messages = [];
            doc.messages.push({
              id: actionMessageId,
              role: "assistant",
              type: "action",
              actionId: action.actionId,
              description: description,
              args: cleanArgs,
              status: "pending",
              timestamp: Date.now(),
            } as AgentActionMessage);
          });

          // Execute action asynchronously and update status
          (async () => {
            try {
              const currentChatDoc = chatDocHandle.doc();
              if (currentChatDoc) {
                const targetDocUrl = action.targetDocUrl as AutomergeUrl;

                // Get target document and capture head before action
                const targetDocHandle = await repo.find(targetDocUrl as any);
                const targetDocBefore = targetDocHandle.doc();
                const beforeHead = targetDocBefore
                  ? Automerge.getHeads(targetDocBefore)[0]
                  : undefined;

                const actionPlugin = actionsByDatatype[action.actionId];

                await executeAction(
                  targetDocUrl,
                  actionPlugin,
                  cleanArgs,
                  chatDocHandle,
                  repo
                );

                // Capture head after action
                const targetDocAfter = targetDocHandle.doc();
                const afterHead = targetDocAfter
                  ? Automerge.getHeads(targetDocAfter)[0]
                  : undefined;

                // Update to success with heads
                chatDocHandle.change((doc) => {
                  const msg = doc.messages?.find(
                    (m) => m.id === actionMessageId
                  ) as AgentActionMessage;
                  if (msg && msg.type === "action") {
                    msg.status = "success";
                    if (beforeHead) msg.beforeHead = beforeHead;
                    if (afterHead) msg.afterHead = afterHead;
                  }
                });
              }
            } catch (error) {
              const errorMsg =
                error instanceof Error ? error.message : String(error);

              // Update to error
              chatDocHandle.change((doc) => {
                const msg = doc.messages?.find(
                  (m) => m.id === actionMessageId
                ) as AgentActionMessage;
                if (msg && msg.type === "action") {
                  msg.status = "error";
                  msg.error = errorMsg;
                }
              });
            }
          })();
        }
      } catch (error) {
        console.error("Failed to parse action block:", error);
      }
    }

    // Handle text content
    if (parseResult.displayText) {
      currentTextContent += parseResult.displayText;

      if (currentTextMessageId) {
        // Update existing text message
        chatDocHandle.change((doc) => {
          const msg = doc.messages?.find(
            (m) => m.id === currentTextMessageId
          ) as AgentTextMessage;
          if (msg && msg.type === "text") {
            msg.content = currentTextContent;
          }
        });
      } else {
        // Create new text message
        currentTextMessageId = `msg-${Date.now()}-${Math.random()}`;
        chatDocHandle.change((doc) => {
          if (!doc.messages) doc.messages = [];
          doc.messages.push({
            id: currentTextMessageId!,
            role: "assistant",
            type: "text",
            content: currentTextContent,
            timestamp: Date.now(),
          } as AgentTextMessage);
        });
      }
    }

    buffer = parseResult.remainingBuffer;
  }

  // Process any remaining buffer content as text
  if (buffer.trim()) {
    currentTextContent += buffer;

    if (currentTextMessageId) {
      chatDocHandle.change((doc) => {
        const msg = doc.messages?.find(
          (m) => m.id === currentTextMessageId
        ) as AgentTextMessage;
        if (msg && msg.type === "text") {
          msg.content = currentTextContent;
        }
      });
    } else {
      chatDocHandle.change((doc) => {
        if (!doc.messages) doc.messages = [];
        doc.messages.push({
          id: `msg-${Date.now()}-${Math.random()}`,
          role: "assistant",
          type: "text",
          content: buffer.trim(),
          timestamp: Date.now(),
        } as AgentTextMessage);
      });
    }
  }
}

// Helper functions
async function loadLLMProvider(
  modelId?: ModelId
): Promise<LLMProviderImplementation | null> {
  try {
    const registry = getRegistry<LLMProviderDescription>(
      "patchwork:llm-provider"
    );
    const allProviders = registry.all();

    // If we have a model ID, find the provider that supports it
    if (modelId) {
      for (const provider of allProviders) {
        if (!provider.supportedModels.includes(modelId)) {
          continue;
        }

        try {
          if (await provider.available()) {
            let loadedProvider: LoadedLLMProvider;
            if (isLoadablePlugin(provider)) {
              const loaded = await registry.load(provider.id);
              if (!loaded || !isLoadedPlugin(loaded)) {
                console.error(`Failed to load provider: ${provider.id}`);
                continue;
              }
              loadedProvider = loaded as LoadedLLMProvider;
            } else if (isLoadedPlugin(provider)) {
              loadedProvider = provider as LoadedLLMProvider;
            } else {
              continue;
            }

            return loadedProvider.module;
          }
        } catch (err) {
          console.error("Error loading provider:", err);
          continue;
        }
      }
    }

    // No model selected yet - try to load any available provider
    for (const provider of allProviders) {
      try {
        if (await provider.available()) {
          let loadedProvider: LoadedLLMProvider;
          if (isLoadablePlugin(provider)) {
            const loaded = await registry.load(provider.id);
            if (!loaded || !isLoadedPlugin(loaded)) {
              console.error(`Failed to load provider: ${provider.id}`);
              continue;
            }
            loadedProvider = loaded as LoadedLLMProvider;
          } else if (isLoadedPlugin(provider)) {
            loadedProvider = provider as LoadedLLMProvider;
          } else {
            continue;
          }

          return loadedProvider.module;
        }
      } catch (err) {
        console.error("Error checking provider:", err);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("Error loading LLM provider:", error);
    return null;
  }
}

async function loadActionsByDatatype(
  docUrls: AutomergeUrl[],
  repo: Repo
): Promise<Record<string, any[]>> {
  const allDataTypeIds = new Set<string>();
  const actionsByDatatype: Record<string, any[]> = {};

  // Collect all data types from all documents
  for (const docUrl of docUrls) {
    try {
      const targetDocHandle = await repo.find(docUrl as any);
      const targetDoc = targetDocHandle.doc();
      if (!targetDoc) continue;

      const dataTypeId = targetDoc?.["@patchwork"]?.type || "*";
      allDataTypeIds.add(dataTypeId);
    } catch (e) {
      console.error(`Failed to load document ${docUrl}:`, e);
    }
  }

  try {
    const registry = getRegistry("patchwork:action");
    const allActions = registry.all();

    // Filter actions that match any of the datatypes
    const matchingActions = allActions.filter((action: any) => {
      const supportedDataTypes = action.supportedDataTypes;
      if (!supportedDataTypes) return false;
      if (supportedDataTypes === "*") return true;

      if (Array.isArray(supportedDataTypes)) {
        return (
          supportedDataTypes.includes("*") ||
          Array.from(allDataTypeIds).some((typeId) =>
            supportedDataTypes.includes(typeId)
          )
        );
      }

      return Array.from(allDataTypeIds).includes(supportedDataTypes);
    });

    // Load all plugins
    await Promise.all(
      matchingActions.map(async (action: any) => {
        try {
          const plugin = await registry.load(action.id);
        } catch (e) {
          console.error(`Failed to load plugin ${action.id}:`, e);
        }
      })
    );
  } catch (e) {
    console.error("Failed to load plugins:", e);
  }

  return actionsByDatatype;
}

function formatSchemaDescription(schema: any): string {
  const shape = schema.shape || schema.def?.shape || schema._def?.shape;

  if (!shape || typeof shape !== "object") {
    return "Arguments: (no schema)";
  }

  const fields = Object.entries(shape).map(([key, value]: [string, any]) => {
    let isOptional = false;
    let innerType = value;

    // Unwrap optional types
    while (
      innerType.def?.innerType ||
      innerType.def?.schema ||
      innerType._def?.innerType ||
      innerType._def?.schema
    ) {
      if (
        innerType.def?.type === "optional" ||
        innerType._def?.typeName === "ZodOptional"
      ) {
        isOptional = true;
      }
      innerType =
        innerType.def?.innerType ||
        innerType.def?.schema ||
        innerType._def?.innerType ||
        innerType._def?.schema;
    }

    const typeName =
      innerType.type || innerType.def?.type || innerType._def?.typeName;
    const description = value.description || innerType.description || "";
    const optionalMarker = isOptional ? " (optional)" : "";

    return `    - ${key}: ${typeName}${optionalMarker}${
      description ? ` - ${description}` : ""
    }`;
  });

  if (fields.length > 0) {
    return `Arguments:\n${fields.join("\n")}`;
  }

  return "Arguments: (empty schema)";
}

function getAvailableActionsForDocument<T>(
  targetDoc: T,
  actionsByDatatype: Record<string, any[]>
): string {
  const descriptions: string[] = [];
  const dataTypeId = targetDoc?.["@patchwork"]?.type || "*";
  const actions = actionsByDatatype[dataTypeId] || [];

  for (const action of actions) {
    let argsDescription = "No arguments";
    if (action.module.argsSchema) {
      try {
        const schema = action.module.argsSchema(targetDoc);
        argsDescription = formatSchemaDescription(schema);
      } catch (e) {
        console.error(`Error generating args description for ${action.id}:`, e);
        argsDescription = "Arguments: (error loading schema)";
      }
    }

    descriptions.push(`  - ${action.id}: ${action.name}\n${argsDescription}`);
  }

  return descriptions.length > 0
    ? `Available actions:\n${descriptions.join("\n\n")}`
    : "No actions available for this document";
}

async function getDocumentContext(
  docUrls: AutomergeUrl[],
  repo: Repo,
  actionsByDatatype: Record<string, any[]>
): Promise<string> {
  const documentDescriptions: string[] = [];

  for (const docUrl of docUrls) {
    try {
      const handle = await repo.find(docUrl as any);
      const doc = handle.doc();
      if (!doc) continue;

      const type = doc?.["@patchwork"]?.type || "unknown";
      const title = doc?.["@patchwork"]?.title || docUrl;

      // Get actions for this document
      const actionsText = getAvailableActionsForDocument(
        doc,
        actionsByDatatype
      );

      documentDescriptions.push(`### Document: ${title}
URL: ${docUrl}
Type: ${type}

${actionsText}`);
    } catch (e) {
      console.error(`Error loading document ${docUrl}:`, e);
    }
  }

  return `## Active Documents

${documentDescriptions.join("\n\n")}

You can view a document's full content using the "view-document" action.`;
}

function getSystemPrompt(): string {
  return `You are an AI assistant helping to edit multiple documents by invoking actions on them.

You have access to multiple documents simultaneously. Each document has its own set of available actions based on its type.

When the user asks for changes, follow these steps:
1. Identify which document(s) the request applies to
2. Review the available actions for those documents and their arguments
3. Determine which action(s) would accomplish the user's goal
4. You can use <thinking> tags to reason about your approach (these will be shown to the user)
5. Use <action> tags to execute actions

Response format:

<thinking description="short summary">
Your reasoning about what actions to take and why
</thinking>

<action description="short description">
{
  "actionId": "action-id-here",
  "targetDocUrl": "automerge:doc-url-here",
  "args": {
    "argName": "value"
  }
}
</action>

You can also include normal text to explain what you're doing.

IMPORTANT:
- Use <thinking> tags for your reasoning process (optional, shown to user with description)
- Both <thinking> and <action> tags should have a "description" attribute (short, a few words)
- You MUST wrap your action commands in <action> tags for them to be executed!
- Inside the <action> tags, put a JSON object with "actionId", "targetDocUrl", and "args"
- The "targetDocUrl" field specifies which document the action should be performed on
- The JSON should be valid JSON
- Only use actions that are listed as available for the target document
- Make sure argument values match the expected types (number, string, boolean, enum)
- You can invoke multiple actions by using multiple <action> tags
- Actions will be executed immediately as they're detected
- Use the "view-document" action if you need to see a document's full content

Example:
<thinking description="Planning approach">
The user wants to increment the counter. I should use the counter-increment action on the counter document.
</thinking>

<action description="Increment counter by 8">
{
  "actionId": "counter-increment",
  "targetDocUrl": "automerge:abc123...",
  "args": {
    "step": 8
  }
}
</action>

The active documents and their available actions are included in the document context below.

Remember: 
- Always specify "targetDocUrl" to indicate which document the action applies to
- Only use actions from the "Available Actions" list for the target document
- Make sure to provide the correct argument types as specified`;
}

async function executeAction(
  targetDocUrl: AutomergeUrl,
  action: any,
  args: any,
  chatDocHandle: DocHandle<ChatDocument>,
  repo: Repo
): Promise<void> {
  const targetDocHandle = await repo.find(targetDocUrl as any);
  const targetDoc = targetDocHandle.doc();

  if (action.module.argsSchema) {
    // Validate args with schema
    const schema = action.module.argsSchema(targetDoc);
    const validatedArgs = schema.parse(args || {});
    await action.module.default(targetDocHandle, repo, validatedArgs);
  } else {
    await action.module.default(targetDocHandle, repo);
  }
}

function buildLLMHistory(messages: ChatMessage[]): LLMMessage[] {
  return messages.map((msg) => {
    if (msg.role === "user" && msg.type === "text") {
      return { role: "user", content: msg.content };
    } else if (msg.role === "assistant") {
      // For assistant messages, format based on type
      if (msg.type === "text") {
        return { role: "assistant", content: msg.content };
      } else if (msg.type === "thinking") {
        return {
          role: "assistant",
          content: `<thinking description="${msg.description}">${msg.content}</thinking>`,
        };
      } else if (msg.type === "action") {
        return {
          role: "assistant",
          content: `<action description="${msg.description}">${JSON.stringify({
            actionId: msg.actionId,
            args: msg.args,
          })}</action>`,
        };
      }
    }
    return { role: "assistant", content: "" };
  });
}

function parseIncrementalBlocks(buffer: string): {
  completeThinking: Array<{ description: string; content: string }>;
  incompleteThinking: { description: string; content: string } | null;
  completeActions: Array<{ description: string; json: string }>;
  incompleteActions: Array<{ description: string; content: string }>;
  displayText: string;
  remainingBuffer: string;
} {
  const completeThinking: Array<{ description: string; content: string }> = [];
  const completeActions: Array<{ description: string; json: string }> = [];
  const incompleteActions: Array<{ description: string; content: string }> = [];
  let incompleteThinking: { description: string; content: string } | null =
    null;
  let displayText = "";
  let workingBuffer = buffer;

  // Extract complete thinking blocks with description attribute
  const thinkingRegex =
    /<thinking\s+description="([^"]+)">([\s\S]*?)<\/thinking>/g;
  let thinkingMatch;
  let lastThinkingEnd = 0;

  while ((thinkingMatch = thinkingRegex.exec(workingBuffer)) !== null) {
    completeThinking.push({
      description: thinkingMatch[1].trim(),
      content: thinkingMatch[2].trim(),
    });
    lastThinkingEnd = thinkingMatch.index + thinkingMatch[0].length;
  }

  // Check for incomplete thinking block
  const incompleteThinkingRegex = /<thinking\s+description="([^"]+)">([^]*?)$/;
  const incompleteMatch = workingBuffer.match(incompleteThinkingRegex);
  if (
    incompleteMatch &&
    !workingBuffer.slice(incompleteMatch.index!).includes("</thinking>")
  ) {
    incompleteThinking = {
      description: incompleteMatch[1].trim(),
      content: incompleteMatch[2].trim(),
    };
  }

  // Extract complete action blocks with description attribute
  const actionRegex = /<action\s+description="([^"]+)">([\s\S]*?)<\/action>/g;
  let actionMatch;
  let lastActionEnd = 0;

  while ((actionMatch = actionRegex.exec(workingBuffer)) !== null) {
    const description = actionMatch[1].trim();
    const json = actionMatch[2].trim();
    completeActions.push({
      description,
      json: JSON.stringify({ description, action: JSON.parse(json) }),
    });
    lastActionEnd = actionMatch.index + actionMatch[0].length;
  }

  // Check for incomplete action blocks
  const incompleteActionRegex = /<action\s+description="([^"]+)">([^]*?)$/g;
  let incompleteActionMatch;
  while (
    (incompleteActionMatch = incompleteActionRegex.exec(workingBuffer)) !== null
  ) {
    if (
      !workingBuffer.slice(incompleteActionMatch.index).includes("</action>")
    ) {
      incompleteActions.push({
        description: incompleteActionMatch[1].trim(),
        content: incompleteActionMatch[2].trim(),
      });
    }
  }

  // Build display text and remaining buffer
  let processedUpTo = 0;
  const allMatches: Array<{
    type: "thinking" | "action";
    start: number;
    end: number;
  }> = [];

  // Find all thinking blocks (with description attribute)
  const thinkingMatches = Array.from(
    workingBuffer.matchAll(
      /<thinking\s+description="[^"]+"[\s\S]*?<\/thinking>/g
    )
  );
  for (const match of thinkingMatches) {
    allMatches.push({
      type: "thinking",
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Find all action blocks (with description attribute)
  const actionMatches = Array.from(
    workingBuffer.matchAll(/<action\s+description="[^"]+"[\s\S]*?<\/action>/g)
  );
  for (const match of actionMatches) {
    allMatches.push({
      type: "action",
      start: match.index!,
      end: match.index! + match[0].length,
    });
  }

  // Sort by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Build display text from non-block content
  for (const match of allMatches) {
    if (match.start > processedUpTo) {
      displayText += workingBuffer.slice(processedUpTo, match.start);
    }
    processedUpTo = match.end;
  }

  // Check if there's an incomplete block at the end
  const hasIncompleteThinking =
    workingBuffer.includes("<thinking") &&
    !workingBuffer
      .slice(workingBuffer.lastIndexOf("<thinking"))
      .includes("</thinking>");
  const hasIncompleteAction =
    workingBuffer.includes("<action") &&
    !workingBuffer
      .slice(workingBuffer.lastIndexOf("<action"))
      .includes("</action>");

  let remainingBuffer = "";
  if (hasIncompleteThinking) {
    const startIndex = workingBuffer.lastIndexOf("<thinking");
    displayText += workingBuffer.slice(processedUpTo, startIndex);
    remainingBuffer = workingBuffer.slice(startIndex);
  } else if (hasIncompleteAction) {
    const startIndex = workingBuffer.lastIndexOf("<action");
    displayText += workingBuffer.slice(processedUpTo, startIndex);
    remainingBuffer = workingBuffer.slice(startIndex);
  } else {
    displayText += workingBuffer.slice(processedUpTo);
  }

  return {
    completeThinking,
    incompleteThinking,
    completeActions,
    incompleteActions,
    displayText,
    remainingBuffer,
  };
}

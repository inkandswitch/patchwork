import { Repo, AutomergeUrl } from "@automerge/automerge-repo";
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

import type { TodoDoc } from "../../todo/src/Todo";

import outdent from "outdent";

// Agent document schema
export type AgentDocument = {
  chatDocUrl: AutomergeUrl;
  modelId?: string;
  activeDocUrls: AutomergeUrl[]; // Track documents that have been interacted with
  todoListUrl: AutomergeUrl;
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
  const { chatDocUrl, modelId, activeDocUrls, todoListUrl } =
    agentDocHandle.doc();
  const todoDocHandle = await repo.find<TodoDoc>(todoListUrl);

  // Load chat document
  const chatDocHandle = await repo.find<ChatDocument>(chatDocUrl);
  const chatDoc = chatDocHandle.doc();

  // Load LLM provider
  const llmProvider = await loadLLMProvider(modelId);
  if (!llmProvider) {
    console.error("Failed to load LLM provider");
    return;
  }

  // Build message history for LLM

  const allDocUrls = [...activeDocUrls, todoListUrl];

  const documentContextPrompt = await getDocumentsContext(allDocUrls, repo);

  const systemPrompt = getSystemPrompt(todoDocHandle.doc(), todoListUrl);

  // Build message history from our message types
  const llmMessages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    { role: "system", content: documentContextPrompt },

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
                const targetUrl = action.target as AutomergeUrl;

                if (!targetUrl) {
                  throw new Error(
                    `Target document not found: ${action.target}`
                  );
                }

                // Get target document and capture head before action
                const targetDocHandle = await repo.find(targetUrl as any);
                const targetDocBefore = targetDocHandle.doc();
                const beforeHead = targetDocBefore
                  ? Automerge.getHeads(targetDocBefore)[0]
                  : undefined;

                // Load action plugin from registry
                const registry = getRegistry("patchwork:action");
                const actionPlugin = await registry.load(action.actionId);

                await executeAction(targetUrl, actionPlugin, cleanArgs, repo);

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

  const todoDoc = todoDocHandle.doc();

  const isDone = todoDoc.todos.every((todo) => todo.done);

  console.log("isDone", isDone);

  // if (todoDoc.todos.some((todo) => !todo.done)) {
  //   step(agentDocUrl, repo);
  // }
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

async function getActionsOfDatatype(doc: any): Promise<any[]> {
  const dataTypeId = doc?.["@patchwork"]?.type || "*";
  const registry = getRegistry("patchwork:action");
  const allActions = registry.all();

  // Filter actions that match this datatype
  const matchingActions = allActions.filter((action: any) => {
    const supportedDataTypes = action.supportedDataTypes;
    if (!supportedDataTypes) return false;
    if (supportedDataTypes === "*") return true;

    if (Array.isArray(supportedDataTypes)) {
      return (
        supportedDataTypes.includes("*") ||
        supportedDataTypes.includes(dataTypeId)
      );
    }

    return supportedDataTypes === dataTypeId;
  });

  // Load all matching actions
  const loadedActions = await Promise.all(
    matchingActions.map(async (action: any) => {
      try {
        const plugin = await registry.load(action.id);
        if (plugin && isLoadedPlugin(plugin)) {
          return plugin;
        }
        return null;
      } catch (e) {
        console.error(`Failed to load plugin ${action.id}:`, e);
        return null;
      }
    })
  );

  return loadedActions.filter((action) => action !== null);
}

function formatSchemaDescription(schema: any): string {
  const shape = schema.shape || schema.def?.shape || schema._def?.shape;

  if (!shape || typeof shape !== "object") {
    return "(no schema)";
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

    return `  - ${key}: ${typeName}${optionalMarker}${
      description ? ` - ${description}` : ""
    }`;
  });

  if (fields.length > 0) {
    return `\n${fields.join("\n")}`;
  }

  return "(empty schema)";
}

async function getAvailableActionsForDocument<T>(
  targetDoc: T,
  docUrl: AutomergeUrl
): Promise<string> {
  const actionDescriptions: string[] = [];
  const actions = await getActionsOfDatatype(targetDoc);

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

    actionDescriptions.push(
      outdent` 
        **${action.name}**  

        target: ${docUrl}
        id: ${action.id}
        args:
        ${argsDescription}
      `
    );
  }

  return actionDescriptions.length > 0
    ? actionDescriptions.join("\n\n")
    : "No actions available for this document";
}

async function getDocumentsContext(
  docUrls: AutomergeUrl[],
  repo: Repo
): Promise<string> {
  const documentActionDescriptions: string[] = [];

  for (const docUrl of docUrls) {
    try {
      const handle = await repo.find(docUrl as any);
      const doc = handle.doc();
      if (!doc) continue;

      const type = (doc as any)?.["@patchwork"]?.type || "unknown";
      const datatype = await getRegistry("patchwork:datatype").load(type);
      const title = datatype?.module.getTitle(doc) ?? "untitled";

      // Get actions for this document
      const actionsText = await getAvailableActionsForDocument(doc, docUrl);

      documentActionDescriptions.push(
        outdent`
          ### ${title}
          url: "${docUrl}"
          type: "${type}"

          ${actionsText}
        `
      );
    } catch (e) {
      console.error(`Error loading document ${docUrl}:`, e);
    }
  }

  return outdent`
    ## Active Documents

    ${documentActionDescriptions.join("\n\n")}
  `;
}

function getSystemPrompt(todoDoc: TodoDoc, todoDocUrl: AutomergeUrl): string {
  return outdent`
    You are an AI assistant helping to edit multiple documents by invoking actions on them.

    You have access to multiple documents simultaneously. Each document has its own set of available actions based on its type.

    When the user asks for changes, follow these steps:
    1. Identify which document(s) the request applies to
    2. Review the available actions for those documents and their arguments
    3. Determine which action(s) would accomplish the user's goal
    4. You can use <thinking> tags to reason about your approach (these will be shown to the user)
    5. Use <action> tags to execute actions

    You have a todo list (url: "${todoDocUrl}") that you can use to track your tasks. If the user asks for something
    more complicated break it down into smaller tasks and add them to the todo list. Only work on tasks that are not already completed.

    ${
      todoDoc.todos.length === 0
        ? "You have no tasks in your todo list yet."
        : todoDoc.todos
            .map(
              (todo) => outdent`
      These are the tasks in your todo list, only work on tasks that are not already completed:
      - [${todo.done ? "x" : " "}] ${todo.description} (id: ${todo.id})`
            )
            .join("\n")
    }

    Once you are done with a task, mark it as complete by using the "todo-complete" action.

    Response format:

    <thinking description="short summary">
    Your reasoning about what actions to take and why
    </thinking>

    <action description="short description">
    {
      "actionId": "action-id",
      "target": "automerge:url",
      "args": {
        "argName": "value"
      }
    }
    </action>

    You can also include normal text to explain what you're doing.

    CRITICAL RULES:
    - Use <thinking> tags for your reasoning process (optional, shown to user with description)
    - Both <thinking> and <action> tags MUST have a "description" attribute (short, a few words)
    - You MUST wrap your action commands in <action> tags for them to be executed!
    - Inside the <action> tags, put a JSON object with "actionId", "target", and "args"
    - The "target" field MUST be one of the document URLs listed in the "Active Documents" section below
    - The "actionId" field MUST be one of the action IDs listed for that specific document below
    - DO NOT invent your own action IDs - only use the exact IDs listed for each document
    - DO NOT invent your own document URLs - only use the exact URLs shown in the "Active Documents" section
    - The JSON must be valid JSON with proper escaping
    - Make sure argument names and values match EXACTLY what's specified in the action's args list
    - You can invoke multiple actions by using multiple <action> tags
    - Actions will be executed immediately as they're detected
    - If an action or document URL you use is not in the list below, your action WILL FAIL

    Example:

    ## Active Documents

    ### Counter
    url: "automerge:2abc3def..."
    type: "counter"

    **Increment Counter**  
    target: automerge:2abc3def...
    id: counter-increment
    args:
      - amount: number (optional, default: 1)

    User: "Increment the counter by 8"

    <thinking description="Planning approach">
    The user wants to increment the counter. I'll use the counter-increment action on the counter document with amount: 8.
    </thinking>

    Great, I will increment the counter by 8.

    <action description="Increment counter by 8">
    {
      "actionId": "counter-increment",
      "target": "automerge:2abc3def...",
      "args": {
        "amount": 8
      }
    }
    </action>
  `;
}

async function executeAction(
  targetDocUrl: AutomergeUrl,
  action: any,
  args: any,
  repo: Repo
): Promise<void> {
  const targetDocHandle = await repo.find(targetDocUrl);
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
            target: msg.target,
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

  while ((thinkingMatch = thinkingRegex.exec(workingBuffer)) !== null) {
    completeThinking.push({
      description: thinkingMatch[1].trim(),
      content: thinkingMatch[2].trim(),
    });
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

  while ((actionMatch = actionRegex.exec(workingBuffer)) !== null) {
    const description = actionMatch[1].trim();
    const json = actionMatch[2].trim();
    completeActions.push({
      description,
      json: JSON.stringify({ description, action: JSON.parse(json) }),
    });
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

import { DocHandle, Repo } from "@automerge/automerge-repo";
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

// Base message properties
type BaseMessage = {
  id: string;
  timestamp: number;
};

// User can only send text messages
export type UserMessage = BaseMessage & {
  role: "user";
  type: "text";
  content: string;
};

// Assistant can send text, thinking, or action messages
export type AssistantTextMessage = BaseMessage & {
  role: "assistant";
  type: "text";
  content: string;
};

export type AssistantThinkingMessage = BaseMessage & {
  role: "assistant";
  type: "thinking";
  description: string;
  content: string;
  inProgress: boolean;
};

export type AssistantActionMessage = BaseMessage & {
  role: "assistant";
  type: "action";
  actionId: string;
  description: string;
  args: any;
  status: "pending" | "success" | "error";
  error?: string;
};

export type AssistantMessage =
  | AssistantTextMessage
  | AssistantThinkingMessage
  | AssistantActionMessage;

export type ChatMessage = UserMessage | AssistantMessage;

// Chat document schema
export type ChatDocument = {
  messages: ChatMessage[];
  targetDocUrl: string;
  modelId?: string;
};

type LLMMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export class Agent {
  private chatDocHandle: DocHandle<ChatDocument>;
  private repo: Repo;
  private modelId?: ModelId;
  private llmProvider: LLMProviderImplementation | null = null;
  private isRunning = false;
  private changeListener?: () => void;
  private actionPluginCache = new Map<string, any>();
  private actionDescriptions: any[] = [];
  private loadedDatatype = false;

  constructor(
    chatDocHandle: DocHandle<ChatDocument>,
    repo: Repo,
    modelId?: ModelId
  ) {
    this.chatDocHandle = chatDocHandle;
    this.repo = repo;
    this.modelId = modelId;
  }

  private async loadLLMProvider(): Promise<boolean> {
    try {
      const registry = getRegistry<LLMProviderDescription>(
        "patchwork:llm-provider"
      );
      const allProviders = registry.all();

      // If we have a model ID, find the provider that supports it
      if (this.modelId) {
        for (const provider of allProviders) {
          if (!provider.supportedModels.includes(this.modelId)) {
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

              this.llmProvider = loadedProvider.module;
              return true;
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

            this.llmProvider = loadedProvider.module;
            return true;
          }
        } catch (err) {
          console.error("Error checking provider:", err);
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error("Error loading LLM provider:", error);
      return false;
    }
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Load LLM provider
    const loaded = await this.loadLLMProvider();
    if (!loaded) {
      console.error("Failed to load LLM provider");
      this.isRunning = false;
      return;
    }

    // Listen for new user messages
    this.changeListener = () => {
      const chatDoc = this.chatDocHandle.doc();
      if (!chatDoc || !chatDoc.messages) return;

      // Load actions for target document
      this.ensurePluginsLoaded(chatDoc);

      // Find the last user message
      const messages = chatDoc.messages;
      if (messages.length === 0) return;

      const lastMessage = messages[messages.length - 1];

      // Check if it's a user message without a following assistant response
      if (lastMessage.role === "user") {
        const hasResponse =
          messages.length > 1 &&
          messages.findIndex((m) => m.id === lastMessage.id) <
            messages.length - 1;

        if (!hasResponse) {
          // Process this message
          this.processUserMessage(lastMessage.id);
        }
      }
    };

    this.chatDocHandle.on("change", this.changeListener);

    // Check if there's already a pending message
    this.changeListener();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.changeListener) {
      this.chatDocHandle.off("change", this.changeListener);
      this.changeListener = undefined;
    }
  }

  private async ensurePluginsLoaded(chatDoc: ChatDocument) {
    if (this.loadedDatatype) return;

    // Get target document from chat doc
    const targetDocHandle = await this.repo.find(chatDoc.targetDocUrl as any);
    const targetDoc = targetDocHandle.doc();
    if (!targetDoc) return;

    const dataTypeId = targetDoc?.["@patchwork"]?.type || "*";

    try {
      const registry = getRegistry("patchwork:action");
      const allActions = registry.all();

      // Filter actions that match the datatype
      const matchingActions = allActions.filter((action: any) => {
        const supportedDataTypes = action.supportedDataTypes;
        if (!supportedDataTypes) return false;
        if (supportedDataTypes === "*") return true;
        if (Array.isArray(supportedDataTypes)) {
          return (
            supportedDataTypes.includes(dataTypeId) ||
            supportedDataTypes.includes("*")
          );
        }
        return supportedDataTypes === dataTypeId;
      });

      this.actionDescriptions = matchingActions;

      // Load all plugins
      await Promise.all(
        matchingActions.map(async (action: any) => {
          try {
            const plugin = await registry.load(action.id);
            if (plugin) {
              this.actionPluginCache.set(action.id, plugin);
            }
          } catch (e) {
            console.error(`Failed to load plugin ${action.id}:`, e);
          }
        })
      );

      this.loadedDatatype = true;
    } catch (e) {
      console.error("Failed to load plugins:", e);
    }
  }

  async getDocumentContext(chatDoc: ChatDocument): Promise<string> {
    const targetDocHandle = await this.repo.find(chatDoc.targetDocUrl as any);
    const targetDoc = targetDocHandle.doc();

    // Build available actions description
    const actionsText = this.getAvailableActionsDescription(targetDoc);

    return `## Current Document State

${JSON.stringify(targetDoc, null, 2)}

## Available Actions

${actionsText}`;
  }

  private getAvailableActionsDescription(targetDoc: any): string {
    const descriptions: string[] = [];

    for (const action of this.actionDescriptions) {
      const plugin = this.actionPluginCache.get(action.id);
      if (!plugin) {
        descriptions.push(
          `  - ${action.id}: ${action.name}\n    (Plugin not loaded yet)`
        );
        continue;
      }

      let argsDescription = "No arguments";
      if (plugin.module.argsSchema) {
        try {
          const schema = plugin.module.argsSchema(targetDoc);
          argsDescription = this.formatSchemaDescription(schema);
        } catch (e) {
          console.error(
            `Error generating args description for ${action.id}:`,
            e
          );
          argsDescription = "Arguments: (error loading schema)";
        }
      }

      descriptions.push(`  - ${action.id}: ${action.name}\n${argsDescription}`);
    }

    return descriptions.join("\n\n") || "No actions available";
  }

  private formatSchemaDescription(schema: any): string {
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

  getSystemPrompt(): string {
    return `You are an AI assistant helping to edit documents by invoking actions on them.

When the user asks for changes, follow these steps:
1. Review the available actions listed below and their arguments
2. Determine which action(s) would accomplish the user's goal
3. You can use <thinking> tags to reason about your approach (these will be shown to the user)
4. Use <action> tags to execute actions

Response format:

<thinking description="short summary">
Your reasoning about what actions to take and why
</thinking>

<action description="short description">
{
  "actionId": "action-id-here",
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
- Inside the <action> tags, put a JSON object with "actionId" and "args"
- The JSON should be valid JSON
- Only use actions that are listed as available
- Make sure argument values match the expected types (number, string, boolean, enum)
- You can invoke multiple actions by using multiple <action> tags
- Actions will be executed immediately as they're detected

Example:
<thinking description="Planning approach">
The user wants to increment the counter by 8. I should use the counter-increment action with step=8.
</thinking>

<action description="Increment counter by 8">
{
  "actionId": "counter-increment",
  "args": {
    "step": 8
  }
}
</action>

The available actions and their current argument schemas are included in the document context.

Remember: Only use actions from the "Available Actions" list. Make sure to provide the correct argument types as specified.`;
  }

  async executeAction(
    actionId: string,
    args: any,
    chatDoc: ChatDocument
  ): Promise<void> {
    const availableActionIds = new Set(
      this.actionDescriptions.map((a: any) => a.id)
    );

    if (!availableActionIds.has(actionId)) {
      throw new Error(
        `Action "${actionId}" is not available for this document`
      );
    }

    const plugin = this.actionPluginCache.get(actionId);
    if (!plugin) {
      throw new Error(`Failed to load action plugin: ${actionId}`);
    }

    const targetDocHandle = await this.repo.find(chatDoc.targetDocUrl as any);
    const targetDoc = targetDocHandle.doc();

    if (plugin.module.argsSchema) {
      // Validate args with schema
      const schema = plugin.module.argsSchema(targetDoc);
      const validatedArgs = schema.parse(args || {});
      await plugin.module.default(targetDocHandle, this.repo, validatedArgs);
    } else {
      await plugin.module.default(targetDocHandle, this.repo);
    }
  }

  private async processUserMessage(messageId: string) {
    // Prevent multiple simultaneous processing
    const chatDoc = this.chatDocHandle.doc();
    if (!chatDoc) return;

    const userMessage = chatDoc.messages.find((m) => m.id === messageId);
    if (!userMessage || userMessage.role !== "user") return;

    // Check if we've already started processing this message
    const nextIndex = chatDoc.messages.findIndex((m) => m.id === messageId) + 1;
    if (nextIndex < chatDoc.messages.length) {
      const nextMessage = chatDoc.messages[nextIndex];
      if (nextMessage.role === "assistant") {
        // Already processing or processed
        return;
      }
    }

    try {
      // Build message history for LLM
      const systemPrompt = this.getSystemPrompt();
      const documentContext = await this.getDocumentContext(chatDoc);

      // Build message history from our message types
      const llmMessages: LLMMessage[] = [
        { role: "system", content: systemPrompt },
        ...this.buildLLMHistory(chatDoc.messages),
        {
          role: "user",
          content: `${userMessage.content}\n\n${documentContext}`,
        },
      ];

      // Stream response with incremental parsing
      let buffer = "";
      let currentTextMessageId: string | null = null;
      let currentTextContent = "";

      if (!this.llmProvider) {
        throw new Error("LLM provider not loaded");
      }

      for await (const chunk of this.llmProvider.chatCompletionStream(
        llmMessages,
        {
          model: this.modelId,
        }
      )) {
        buffer += chunk;

        // Try to parse complete blocks
        const parseResult = this.parseIncrementalBlocks(buffer);

        // Process incomplete thinking block (create or update)
        if (parseResult.incompleteThinking) {
          const messages = this.chatDocHandle.doc()?.messages || [];
          let existing: AssistantThinkingMessage | undefined;
          for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (
              m.role === "assistant" &&
              m.type === "thinking" &&
              (m as AssistantThinkingMessage).description ===
                parseResult.incompleteThinking.description
            ) {
              existing = m as AssistantThinkingMessage;
              break;
            }
          }

          if (existing) {
            // Update existing thinking
            this.chatDocHandle.change((doc) => {
              const msg = doc.messages?.find(
                (m) => m.id === existing!.id
              ) as AssistantThinkingMessage;
              if (msg && msg.type === "thinking") {
                msg.content = parseResult.incompleteThinking!.content;
              }
            });
          } else {
            // Create new in-progress thinking
            this.chatDocHandle.change((doc) => {
              if (!doc.messages) doc.messages = [];
              doc.messages.push({
                id: `msg-${Date.now()}-${Math.random()}`,
                role: "assistant",
                type: "thinking",
                description: parseResult.incompleteThinking!.description,
                content: parseResult.incompleteThinking!.content,
                inProgress: true,
                timestamp: Date.now(),
              } as AssistantThinkingMessage);
            });
          }
        }

        // Mark complete thinking blocks as done
        for (const thinking of parseResult.completeThinking) {
          const messages = this.chatDocHandle.doc()?.messages || [];
          let existing: AssistantThinkingMessage | undefined;
          for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (
              m.role === "assistant" &&
              m.type === "thinking" &&
              (m as AssistantThinkingMessage).description ===
                thinking.description
            ) {
              existing = m as AssistantThinkingMessage;
              break;
            }
          }

          if (existing) {
            // Update to complete
            this.chatDocHandle.change((doc) => {
              const msg = doc.messages?.find(
                (m) => m.id === existing!.id
              ) as AssistantThinkingMessage;
              if (msg && msg.type === "thinking") {
                msg.content = thinking.content;
                msg.inProgress = false;
              }
            });
          }
        }

        // Skip incomplete actions - we only create messages when we have complete action data

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

            const messages = this.chatDocHandle.doc()?.messages || [];
            let existing: AssistantActionMessage | undefined;
            for (let i = messages.length - 1; i >= 0; i--) {
              const m = messages[i];
              if (
                m.role === "assistant" &&
                m.type === "action" &&
                (m as AssistantActionMessage).description === description
              ) {
                existing = m as AssistantActionMessage;
                break;
              }
            }

            if (existing) {
              const actionMessageId = existing.id;
              // Update with actionId and args
              this.chatDocHandle.change((doc) => {
                const msg = doc.messages?.find(
                  (m) => m.id === actionMessageId
                ) as AssistantActionMessage;
                if (msg && msg.type === "action") {
                  msg.actionId = action.actionId;
                  msg.args = cleanArgs;
                }
              });

              // Execute action asynchronously and update status
              (async () => {
                try {
                  const currentChatDoc = this.chatDocHandle.doc();
                  if (currentChatDoc) {
                    await this.executeAction(
                      action.actionId,
                      cleanArgs,
                      currentChatDoc
                    );

                    // Update to success
                    this.chatDocHandle.change((doc) => {
                      const msg = doc.messages?.find(
                        (m) => m.id === actionMessageId
                      ) as AssistantActionMessage;
                      if (msg && msg.type === "action") {
                        msg.status = "success";
                      }
                    });
                  }
                } catch (error) {
                  const errorMsg =
                    error instanceof Error ? error.message : String(error);

                  // Update to error
                  this.chatDocHandle.change((doc) => {
                    const msg = doc.messages?.find(
                      (m) => m.id === actionMessageId
                    ) as AssistantActionMessage;
                    if (msg && msg.type === "action") {
                      msg.status = "error";
                      msg.error = errorMsg;
                    }
                  });
                }
              })();
            } else {
              // Create new action message with complete data
              const actionMessageId = `msg-${Date.now()}-${Math.random()}`;
              this.chatDocHandle.change((doc) => {
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
                } as AssistantActionMessage);
              });

              // Execute action asynchronously and update status
              (async () => {
                try {
                  const currentChatDoc = this.chatDocHandle.doc();
                  if (currentChatDoc) {
                    await this.executeAction(
                      action.actionId,
                      cleanArgs,
                      currentChatDoc
                    );

                    // Update to success
                    this.chatDocHandle.change((doc) => {
                      const msg = doc.messages?.find(
                        (m) => m.id === actionMessageId
                      ) as AssistantActionMessage;
                      if (msg && msg.type === "action") {
                        msg.status = "success";
                      }
                    });
                  }
                } catch (error) {
                  const errorMsg =
                    error instanceof Error ? error.message : String(error);

                  // Update to error
                  this.chatDocHandle.change((doc) => {
                    const msg = doc.messages?.find(
                      (m) => m.id === actionMessageId
                    ) as AssistantActionMessage;
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
            this.chatDocHandle.change((doc) => {
              const msg = doc.messages?.find(
                (m) => m.id === currentTextMessageId
              ) as AssistantTextMessage;
              if (msg && msg.type === "text") {
                msg.content = currentTextContent;
              }
            });
          } else {
            // Create new text message
            currentTextMessageId = `msg-${Date.now()}-${Math.random()}`;
            this.chatDocHandle.change((doc) => {
              if (!doc.messages) doc.messages = [];
              doc.messages.push({
                id: currentTextMessageId!,
                role: "assistant",
                type: "text",
                content: currentTextContent,
                timestamp: Date.now(),
              } as AssistantTextMessage);
            });
          }
        }

        buffer = parseResult.remainingBuffer;
      }

      // Process any remaining buffer content as text
      if (buffer.trim()) {
        currentTextContent += buffer;

        if (currentTextMessageId) {
          this.chatDocHandle.change((doc) => {
            const msg = doc.messages?.find(
              (m) => m.id === currentTextMessageId
            ) as AssistantTextMessage;
            if (msg && msg.type === "text") {
              msg.content = currentTextContent;
            }
          });
        } else {
          this.chatDocHandle.change((doc) => {
            if (!doc.messages) doc.messages = [];
            doc.messages.push({
              id: `msg-${Date.now()}-${Math.random()}`,
              role: "assistant",
              type: "text",
              content: buffer.trim(),
              timestamp: Date.now(),
            } as AssistantTextMessage);
          });
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.chatDocHandle.change((doc) => {
        if (!doc.messages) doc.messages = [];
        doc.messages.push({
          id: `msg-${Date.now()}-${Math.random()}`,
          role: "assistant",
          type: "text",
          content: `Error: ${errorMsg}`,
          timestamp: Date.now(),
        } as AssistantTextMessage);
      });
    }
  }

  private buildLLMHistory(messages: ChatMessage[]): LLMMessage[] {
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
            content: `<action description="${msg.description}">${JSON.stringify(
              {
                actionId: msg.actionId,
                args: msg.args,
              }
            )}</action>`,
          };
        }
      }
      return { role: "assistant", content: "" };
    });
  }

  private parseIncrementalBlocks(buffer: string): {
    completeThinking: Array<{ description: string; content: string }>;
    incompleteThinking: { description: string; content: string } | null;
    completeActions: Array<{ description: string; json: string }>;
    incompleteActions: Array<{ description: string; content: string }>;
    displayText: string;
    remainingBuffer: string;
  } {
    const completeThinking: Array<{ description: string; content: string }> =
      [];
    const completeActions: Array<{ description: string; json: string }> = [];
    const incompleteActions: Array<{ description: string; content: string }> =
      [];
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
    const incompleteThinkingRegex =
      /<thinking\s+description="([^"]+)">([^]*?)$/;
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
      (incompleteActionMatch = incompleteActionRegex.exec(workingBuffer)) !==
      null
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
}

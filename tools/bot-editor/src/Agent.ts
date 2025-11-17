import { DocHandle, Repo } from "@automerge/automerge-repo";
import { getRegistry } from "@patchwork/plugins";
import type { ModelId } from "./providers/types";

// Chat message type
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  timestamp: number;
  thinking?: string[];
  actions?: Array<{
    actionId: string;
    args: any;
    status: "success" | "error";
    error?: string;
  }>;
};

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

type StreamFunction = (
  messages: LLMMessage[],
  options?: { model?: ModelId }
) => AsyncGenerator<string, void, unknown>;

export class Agent {
  private chatDocHandle: DocHandle<ChatDocument>;
  private targetDocHandle: DocHandle<any>;
  private repo: Repo;
  private chatCompletionStream: StreamFunction;
  private modelId?: ModelId;
  private isRunning = false;
  private changeListener?: () => void;
  private actionPluginCache = new Map<string, any>();
  private actionDescriptions: any[] = [];
  private loadedDatatype = false;

  constructor(
    chatDocHandle: DocHandle<ChatDocument>,
    targetDocHandle: DocHandle<any>,
    repo: Repo,
    chatCompletionStream: StreamFunction,
    modelId?: ModelId
  ) {
    this.chatDocHandle = chatDocHandle;
    this.targetDocHandle = targetDocHandle;
    this.repo = repo;
    this.chatCompletionStream = chatCompletionStream;
    this.modelId = modelId;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Load actions for target document
    this.ensurePluginsLoaded();

    // Listen for new user messages
    this.changeListener = () => {
      const doc = this.chatDocHandle.docSync();
      if (!doc || !doc.messages) return;

      // Find the last user message
      const messages = doc.messages;
      if (messages.length === 0) return;

      const lastMessage = messages[messages.length - 1];
      
      // Check if it's a user message without a following assistant response
      if (lastMessage.role === "user") {
        const hasResponse = messages.length > 1 && 
          messages.findIndex(m => m.id === lastMessage.id) < messages.length - 1;
        
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

  private async ensurePluginsLoaded() {
    if (this.loadedDatatype) return;

    const targetDoc = this.targetDocHandle.docSync();
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

  getDocumentContext(): string {
    const targetDoc = this.targetDocHandle.docSync();
    
    // Build available actions description
    const actionsText = this.getAvailableActionsDescription();

    return `## Current Document State

${JSON.stringify(targetDoc, null, 2)}

## Available Actions

${actionsText}`;
  }

  private getAvailableActionsDescription(): string {
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
          const schema = plugin.module.argsSchema(this.targetDocHandle.docSync());
          argsDescription = this.formatSchemaDescription(schema);
        } catch (e) {
          console.error(`Error generating args description for ${action.id}:`, e);
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
3. You can use <thinking> tags to reason about your approach (these will be shown collapsed to the user)
4. Use <action> tags to execute actions

Response format:

<thinking>
Your reasoning about what actions to take and why
</thinking>

<action>
[
  {
    "actionId": "action-id-here",
    "args": {
      "argName": "value"
    }
  }
]
</action>

You can also include normal text to explain what you're doing.

IMPORTANT:
- Use <thinking> tags for your reasoning process (optional, shown collapsed to user)
- You MUST wrap your action commands in <action> tags for them to be executed!
- Inside the <action> tags, put a JSON array of action commands
- The JSON array should be valid JSON
- Only use actions that are listed as available
- Make sure argument values match the expected types (number, string, boolean, enum)
- You can invoke multiple actions in sequence by including multiple action objects in the array
- Actions will be executed immediately as they're detected

Example:
<thinking>
The user wants to increment the counter by 8. I should use the counter-increment action with step=8.
</thinking>

<action>
[
  {
    "actionId": "counter-increment",
    "args": {
      "step": 8
    }
  }
]
</action>

The available actions and their current argument schemas are included in the document context.

Remember: Only use actions from the "Available Actions" list. Make sure to provide the correct argument types as specified.`;
  }

  async executeAction(actionId: string, args: any): Promise<void> {
    const availableActionIds = new Set(this.actionDescriptions.map((a: any) => a.id));

    if (!availableActionIds.has(actionId)) {
      throw new Error(
        `Action "${actionId}" is not available for this document`
      );
    }

    const plugin = this.actionPluginCache.get(actionId);
    if (!plugin) {
      throw new Error(`Failed to load action plugin: ${actionId}`);
    }

    if (plugin.module.argsSchema) {
      // Validate args with schema
      const schema = plugin.module.argsSchema(this.targetDocHandle.docSync());
      const validatedArgs = schema.parse(args || {});
      await plugin.module.default(this.targetDocHandle, this.repo, validatedArgs);
    } else {
      await plugin.module.default(this.targetDocHandle, this.repo);
    }
  }

  private async processUserMessage(messageId: string) {
    // Prevent multiple simultaneous processing
    const chatDoc = this.chatDocHandle.docSync();
    if (!chatDoc) return;

    const userMessage = chatDoc.messages.find((m) => m.id === messageId);
    if (!userMessage) return;

    // Check if we've already started processing this message
    const nextIndex = chatDoc.messages.findIndex((m) => m.id === messageId) + 1;
    if (nextIndex < chatDoc.messages.length) {
      const nextMessage = chatDoc.messages[nextIndex];
      if (nextMessage.role === "assistant") {
        // Already processing or processed
        return;
      }
    }

    // Create assistant message
    const assistantMessageId = `msg-${Date.now()}-${Math.random()}`;
    this.chatDocHandle.change((doc) => {
      if (!doc.messages) doc.messages = [];
      doc.messages.push({
        id: assistantMessageId,
        role: "assistant",
        content: "",
        displayContent: "",
        timestamp: Date.now(),
        thinking: [],
        actions: [],
      });
    });

    try {
      // Build message history for LLM
      const systemPrompt = this.getSystemPrompt();
      const documentContext = this.getDocumentContext();

      const messages: LLMMessage[] = [
        { role: "system", content: systemPrompt },
        ...chatDoc.messages
          .slice(0, -1) // Exclude the assistant message we just added
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
        {
          role: "user",
          content: `${userMessage.content}\n\n${documentContext}`,
        },
      ];

      // Stream response with incremental parsing
      let fullContent = "";
      let displayContent = "";
      let buffer = "";
      const thinkingBlocks: string[] = [];
      const executedActions: Array<{
        actionId: string;
        args: any;
        status: "success" | "error";
        error?: string;
      }> = [];

      for await (const chunk of this.chatCompletionStream(messages, {
        model: this.modelId,
      })) {
        buffer += chunk;
        fullContent += chunk;

        // Try to parse complete blocks
        const parseResult = this.parseIncrementalBlocks(buffer);
        
        // Process complete thinking blocks
        for (const thinking of parseResult.completeThinking) {
          thinkingBlocks.push(thinking);
        }

        // Process complete action blocks
        for (const actionBlock of parseResult.completeActions) {
          try {
            const actions = JSON.parse(actionBlock);
            if (Array.isArray(actions)) {
              for (const action of actions) {
                try {
                  await this.executeAction(action.actionId, action.args);
                  executedActions.push({
                    actionId: action.actionId,
                    args: action.args,
                    status: "success",
                  });
                  displayContent += `\n✓ Executed: ${action.actionId}\n`;
                } catch (error) {
                  const errorMsg = error instanceof Error ? error.message : String(error);
                  executedActions.push({
                    actionId: action.actionId,
                    args: action.args,
                    status: "error",
                    error: errorMsg,
                  });
                  displayContent += `\n✗ Failed: ${action.actionId} - ${errorMsg}\n`;
                }
              }
            }
          } catch (error) {
            console.error("Failed to parse action block:", error);
            displayContent += `\n✗ Failed to parse action block\n`;
          }
        }

        // Update display content with remaining text
        displayContent += parseResult.displayText;
        buffer = parseResult.remainingBuffer;

        // Update the message
        this.chatDocHandle.change((doc) => {
          const msg = doc.messages?.find((m) => m.id === assistantMessageId);
          if (msg) {
            msg.content = fullContent;
            msg.displayContent = displayContent;
            msg.thinking = thinkingBlocks;
            msg.actions = executedActions;
          }
        });
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        displayContent += buffer;
        this.chatDocHandle.change((doc) => {
          const msg = doc.messages?.find((m) => m.id === assistantMessageId);
          if (msg) {
            msg.content = fullContent;
            msg.displayContent = displayContent;
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      this.chatDocHandle.change((doc) => {
        const msg = doc.messages?.find((m) => m.id === assistantMessageId);
        if (msg) {
          msg.content = `Error: ${errorMsg}`;
          msg.displayContent = `Error: ${errorMsg}`;
        }
      });
    }
  }

  private parseIncrementalBlocks(buffer: string): {
    completeThinking: string[];
    completeActions: string[];
    displayText: string;
    remainingBuffer: string;
  } {
    const completeThinking: string[] = [];
    const completeActions: string[] = [];
    let displayText = "";
    let workingBuffer = buffer;

    // Extract complete thinking blocks
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
    let thinkingMatch;
    let lastThinkingEnd = 0;

    while ((thinkingMatch = thinkingRegex.exec(workingBuffer)) !== null) {
      completeThinking.push(thinkingMatch[1].trim());
      lastThinkingEnd = thinkingMatch.index + thinkingMatch[0].length;
    }

    // Extract complete action blocks
    const actionRegex = /<action>([\s\S]*?)<\/action>/g;
    let actionMatch;
    let lastActionEnd = 0;

    while ((actionMatch = actionRegex.exec(workingBuffer)) !== null) {
      completeActions.push(actionMatch[1].trim());
      lastActionEnd = actionMatch.index + actionMatch[0].length;
    }

    // Build display text and remaining buffer
    let processedUpTo = 0;
    const allMatches: Array<{ type: "thinking" | "action"; start: number; end: number }> = [];

    // Find all thinking blocks
    const thinkingMatches = Array.from(workingBuffer.matchAll(/<thinking>[\s\S]*?<\/thinking>/g));
    for (const match of thinkingMatches) {
      allMatches.push({
        type: "thinking",
        start: match.index!,
        end: match.index! + match[0].length,
      });
    }

    // Find all action blocks
    const actionMatches = Array.from(workingBuffer.matchAll(/<action>[\s\S]*?<\/action>/g));
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
    const hasIncompleteThinking = workingBuffer.includes("<thinking>") && 
      !workingBuffer.slice(workingBuffer.lastIndexOf("<thinking>")).includes("</thinking>");
    const hasIncompleteAction = workingBuffer.includes("<action>") && 
      !workingBuffer.slice(workingBuffer.lastIndexOf("<action>")).includes("</action>");

    let remainingBuffer = "";
    if (hasIncompleteThinking) {
      const startIndex = workingBuffer.lastIndexOf("<thinking>");
      displayText += workingBuffer.slice(processedUpTo, startIndex);
      remainingBuffer = workingBuffer.slice(startIndex);
    } else if (hasIncompleteAction) {
      const startIndex = workingBuffer.lastIndexOf("<action>");
      displayText += workingBuffer.slice(processedUpTo, startIndex);
      remainingBuffer = workingBuffer.slice(startIndex);
    } else {
      displayText += workingBuffer.slice(processedUpTo);
    }

    return {
      completeThinking,
      completeActions,
      displayText,
      remainingBuffer,
    };
  }
}


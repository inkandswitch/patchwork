import Anthropic from "@anthropic-ai/sdk";
import type { LLMProviderPlugin } from "./types";

export const anthropicProvider: LLMProviderPlugin = {
  type: "patchwork:llm-provider",
  id: "anthropic",
  name: "Anthropic",
  supportedModels: ["claude-sonnet-4-0", "claude-3-5-sonnet-20241022"],
  async available() {
    const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const localKey = localStorage.getItem("anthropic-api-key");
    return !!(envKey || localKey);
  },
  async load() {
    const apiKey =
      import.meta.env.VITE_ANTHROPIC_API_KEY ||
      localStorage.getItem("anthropic-api-key");
    if (!apiKey) throw new Error("No Anthropic API key found");

    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    return {
      async chatCompletion(messages, options) {
        // Convert messages to Anthropic format
        // Anthropic doesn't support system messages in the messages array
        const systemMessage = messages.find((m) => m.role === "system");
        const anthropicMessages = messages
          .filter((m) => m.role !== "system")
          .map((msg) => ({
            role: msg.role === "system" ? "user" : msg.role,
            content: msg.content,
          })) as { role: "user" | "assistant"; content: string }[];

        // Anthropic requires at least one message
        if (anthropicMessages.length === 0) {
          throw new Error("At least one non-system message is required");
        }

        const response = await client.messages.create({
          model: options?.model || "claude-sonnet-4-0",
          messages: anthropicMessages,
          temperature: 0,
          max_tokens: 20000,
          ...(systemMessage && { system: systemMessage.content }),
        });

        // Anthropic always returns at least one text block
        const textContent = response.content.find(
          (block) => block.type === "text"
        );
        return textContent?.text || "";
      },
      async *chatCompletionStream(messages, options) {
        // Convert messages to Anthropic format
        const systemMessage = messages
          .filter((m) => m.role === "system")
          .map((m) => m.content)
          .join("\n");
        const anthropicMessages = messages
          .filter((m) => m.role !== "system")
          .map((msg) => ({
            role: msg.role === "system" ? "user" : msg.role,
            content: msg.content,
          })) as { role: "user" | "assistant"; content: string }[];

        // Anthropic requires at least one message
        if (anthropicMessages.length === 0) {
          throw new Error("At least one non-system message is required");
        }

        console.log(systemMessage, anthropicMessages);

        const stream = await client.messages.stream({
          model: options?.model || "claude-sonnet-4-0",
          messages: anthropicMessages,
          max_tokens: 20000,
          ...(systemMessage && { system: systemMessage }),
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            yield event.delta.text;
          }
        }
      },
    };
  },
};

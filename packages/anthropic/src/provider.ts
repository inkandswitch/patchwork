import Anthropic from "@anthropic-ai/sdk";
import { LLMAdapter, LLMChatMessage, PromptOptions } from "@patchwork/sdk/llm";

export const ANTHROPIC_MODEL_IDS = ["claude-sonnet-4-0"] as const;
export type AnthropicModelId = (typeof ANTHROPIC_MODEL_IDS)[number];

export const DEFAULT_ANTHROPIC_MODEL = ANTHROPIC_MODEL_IDS[0];

export class AnthropicAdapter implements LLMAdapter {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async chatCompletion(
    messages: LLMChatMessage[],
    options?: PromptOptions
  ): Promise<string> {
    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg) => ({
      role: msg.role === "system" ? "user" : msg.role,
      content: msg.content,
    })) as { role: "user" | "assistant"; content: string }[];

    const response = await this.client.messages.create({
      model: options?.model || DEFAULT_ANTHROPIC_MODEL,
      messages: anthropicMessages,
      max_tokens: 20000,
    });

    // Anthropic always returns at least one text block
    const textContent = response.content.find((block) => block.type === "text");
    return textContent?.text || "";
  }

  async stringCompletion(
    message: string,
    options?: PromptOptions
  ): Promise<string> {
    return this.chatCompletion([{ role: "user", content: message }], options);
  }
}

export const createAdapter = (apiKey?: string) => {
  const key = apiKey || (import.meta as any).env?.["VITE_ANTHROPIC_API_KEY"];
  if (!key) {
    throw new Error("No Anthropic API key provided");
  }
  return new AnthropicAdapter(key);
};

export const getDefaultApiKey = () => {
  return (import.meta as any).env?.["VITE_ANTHROPIC_API_KEY"];
};

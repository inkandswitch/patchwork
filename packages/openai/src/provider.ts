import OpenAI from "openai";
import { LLMAdapter, LLMChatMessage, PromptOptions } from "@patchwork/sdk/llm";

export const OPENAI_MODEL_IDS = ["gpt-4o"] as const;
export type OpenAIModelId = (typeof OPENAI_MODEL_IDS)[number];

export const OPENAI_MODEL = "gpt-4o";

export class OpenAIAdapter implements LLMAdapter {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async chatCompletion(
    messages: LLMChatMessage[],
    options?: PromptOptions
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || OPENAI_MODEL,
      temperature: options?.temperature || 0,
      messages,
    });
    return response.choices[0].message.content || "";
  }

  async stringCompletion(
    message: string,
    options?: PromptOptions
  ): Promise<string> {
    return this.chatCompletion([{ role: "user", content: message }], options);
  }
}

export const createAdapter = (apiKey?: string) => {
  const key = apiKey || (import.meta as any).env?.["VITE_OPENAI_API_KEY"];
  if (!key) {
    throw new Error("No OpenAI API key provided");
  }
  return new OpenAIAdapter(key);
};

export const getDefaultApiKey = () => {
  return (import.meta as any).env?.["VITE_OPENAI_API_KEY"];
};

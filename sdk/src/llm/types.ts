import { Plugin, LoadedPlugin } from "../plugins";

// Generic string type for model IDs instead of hardcoded union
export type ModelId = string;

export interface LLMChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PromptOptions {
  model?: string;
  temperature?: number;
}

export interface LLMAdapter {
  chatCompletion(
    messages: LLMChatMessage[],
    options?: PromptOptions
  ): Promise<string>;

  stringCompletion(message: string, options?: PromptOptions): Promise<string>;
}

// LLM Provider Plugin type
export interface LLMProviderDescription {
  id: string;
  type: "patchwork:llm-provider";
  name: string;
  supportedModels: ModelId[];
  /**
   * Checks if this provider is available for use without loading the full implementation.
   * For cloud providers, this typically checks internet connectivity.
   * For local providers, this checks if the model is available on the device.
   */
  available: () => Promise<boolean>;
}

export interface LLMProviderImplementation {
  createAdapter: (apiKey?: string) => LLMAdapter;
  getDefaultApiKey: () => string | undefined;
}

export type LLMProviderPlugin = Plugin<
  LLMProviderDescription,
  LLMProviderImplementation
>;
export type LoadedLLMProviderPlugin = LoadedPlugin<
  LLMProviderDescription,
  LLMProviderImplementation
>;

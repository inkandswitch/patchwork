import type {
  PluginDescription,
  LoadedPlugin,
  Plugin,
} from "@patchwork/plugins";

export type ModelId = string;

export interface LLMProviderDescription extends PluginDescription {
  type: "patchwork:llm-provider";
  supportedModels: ModelId[];
  available(): Promise<boolean>;
  load(): Promise<LLMProviderImplementation>;
}

export interface LLMProviderImplementation {
  chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: ModelId }
  ): Promise<string>;
  chatCompletionStream(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: ModelId }
  ): AsyncGenerator<string, void, unknown>;
}

export type LLMProviderPlugin = Plugin<LLMProviderDescription>;
export type LoadedLLMProvider = LoadedPlugin<
  LLMProviderDescription,
  LLMProviderImplementation
>;


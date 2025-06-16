import { LLMAdapter, LLMChatMessage, PromptOptions, ModelId } from "./types";
export * from "./types";
export * from "./bots";

import {
  createAdapter,
  getProviderPluginForModel,
  getDefaultProvider,
} from "./providers";
import { getPlugins } from "../plugins";
import { Plugin } from "../plugins/types";
import { LLMProviderDescription } from "./types";

export type { ModelId } from "./types";

// Dynamic check for LLM functionality based on available providers
export async function isLLMActive(): Promise<boolean> {
  const defaultProvider = await getDefaultProvider();
  return defaultProvider !== undefined;
}

/**
 * Get the default model ID from the first available provider
 */
export async function getDefaultModelId(): Promise<ModelId | undefined> {
  const defaultProvider = await getDefaultProvider();
  return defaultProvider?.supportedModels[0];
}

/**
 * Get the LLM adapter for the specified model ID
 */
export async function getLLMAdapter(
  modelId?: ModelId
): Promise<LLMAdapter | undefined> {
  try {
    const targetModel = modelId || await getDefaultModelId();
    if (!targetModel) return undefined;

    return await createAdapter(targetModel);
  } catch (error) {
    console.error("Error getting adapter for model", modelId, error);
    throw error;
  }
}

// Convenience methods that use the appropriate adapter based on model
export async function chatCompletion(
  messages: LLMChatMessage[],
  options?: PromptOptions
): Promise<string> {
  const adapter = await getLLMAdapter(options?.model);
  if (!adapter) {
    throw new Error("No LLM adapter available");
  }
  return adapter.chatCompletion(messages, options);
}

export async function stringCompletion(
  message: string,
  options?: PromptOptions
): Promise<string> {
  const adapter = await getLLMAdapter(options?.model);
  if (!adapter) {
    throw new Error("No LLM adapter available");
  }
  return adapter.stringCompletion(message, options);
}

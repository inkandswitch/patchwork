import { getLoadedPlugin, getPlugins } from "../plugins";
import {
  LoadedLLMProviderPlugin,
  LLMAdapter,
  LLMProviderDescription,
  ModelId,
} from "./types";
import { Plugin } from "../plugins/types";

/**
 * Gets a provider plugin by its ID
 */
export async function getProviderPlugin(
  providerId: string
): Promise<LoadedLLMProviderPlugin | undefined> {
  return getLoadedPlugin<LoadedLLMProviderPlugin>(
    "patchwork:llm-provider",
    providerId
  );
}

/**
 * Gets the provider plugin for a specific model
 */
export async function getProviderPluginForModel(
  model?: ModelId
): Promise<LoadedLLMProviderPlugin | undefined> {
  if (!model) return getDefaultProvider();

  const providerPlugins = getPlugins<Plugin<LLMProviderDescription>>(
    "patchwork:llm-provider"
  );

  console.log({
    providerPlugins,
  });

  // Find a provider that supports the requested model
  for (const provider of providerPlugins) {
    if (provider.supportedModels?.includes(model)) {
      // Check if the provider is available
      if (await provider.available()) {
        return await getLoadedPlugin<LoadedLLMProviderPlugin>(
          "patchwork:llm-provider",
          provider.id
        );
      }
    }
  }

  return undefined;
}

/**
 * Creates an adapter instance for the specified model
 * @param modelId The model ID
 * @param apiKey Optional API key (will use default if not provided)
 */
export async function createAdapter(
  modelId?: ModelId,
  apiKey?: string
): Promise<LLMAdapter> {
  const provider = await getProviderPluginForModel(modelId);
  if (!provider) {
    throw new Error(`No provider available for model ${modelId || "default"}`);
  }

  // Load the implementation and create adapter
  return provider.module.createAdapter(apiKey);
}

/**
 * Returns the default provider based on available providers
 */
export async function getDefaultProvider(): Promise<
  LoadedLLMProviderPlugin | undefined
> {
  const providerPlugins = getPlugins<Plugin<LLMProviderDescription>>(
    "patchwork:llm-provider"
  );

  for (const provider of providerPlugins) {
    if (await provider.available()) {
      return await getLoadedPlugin<LoadedLLMProviderPlugin>(
        "patchwork:llm-provider",
        provider.id
      );
    }
  }

  return undefined;
}

import { useEffect, useState } from "react";
import { getRegistry, isLoadablePlugin, isLoadedPlugin } from "@patchwork/plugins";
import type { ModelId, LLMProviderDescription, LoadedLLMProvider } from "../providers/types";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const useLLMProvider = (modelId: ModelId | undefined) => {
  const [llmActive, setLlmActive] = useState<boolean | undefined>(undefined);
  const [chatCompletion, setChatCompletion] = useState<
    | ((
        messages: ChatMessage[],
        options?: { model?: ModelId }
      ) => Promise<string>)
    | null
  >(null);

  useEffect(() => {
    const loadProviderForModel = async () => {
      try {
        const registry = getRegistry<LLMProviderDescription>("patchwork:llm-provider");
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

                const module = loadedProvider.module;
                setChatCompletion(() => module.chatCompletion);
                setLlmActive(true);
                return;
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

              const module = loadedProvider.module;
              setChatCompletion(() => module.chatCompletion);
              setLlmActive(true);
              return;
            }
          } catch (err) {
            console.error("Error checking provider:", err);
            continue;
          }
        }

        setLlmActive(false);
      } catch (error) {
        console.error("Error loading LLM provider:", error);
        setLlmActive(false);
      }
    };

    loadProviderForModel();
  }, [modelId]);

  return { llmActive, chatCompletion };
};


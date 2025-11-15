import type { LLMProviderPlugin } from "./types";

export * from "./types";

export const openAIProvider: LLMProviderPlugin = {
  type: "patchwork:llm-provider",
  id: "openai",
  name: "OpenAI",
  supportedModels: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  async available() {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    const localKey = localStorage.getItem("openai-api-key");
    return !!(envKey || localKey);
  },
  async load() {
    return {
      async chatCompletion(messages, options) {
        const apiKey =
          import.meta.env.VITE_OPENAI_API_KEY ||
          localStorage.getItem("openai-api-key");
        if (!apiKey) throw new Error("No OpenAI API key found");

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              messages,
              model: options?.model || "gpt-4",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      },
    };
  },
};

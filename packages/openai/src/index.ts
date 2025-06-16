import { LoadablePlugin } from "@patchwork/sdk";
import {
  LLMProviderDescription,
  LLMProviderImplementation,
} from "@patchwork/sdk/llm";
import { OPENAI_MODEL_IDS } from "./provider";

export const plugins: LoadablePlugin<
  LLMProviderDescription,
  LLMProviderImplementation
>[] = [
  {
    id: "openai",
    type: "patchwork:llm-provider",
    name: "OpenAI",
    supportedModels: [...OPENAI_MODEL_IDS],
    async load() {
      return import("./provider");
    },
    async available() {
      // Check if we have internet connectivity
      return navigator.onLine;
    },
  },
];
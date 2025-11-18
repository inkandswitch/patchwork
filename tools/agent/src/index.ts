import { type Plugin } from "@patchwork/plugins";
import { openAIProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";

export const plugins: Plugin<any>[] = [openAIProvider, anthropicProvider];

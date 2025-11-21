import { type Plugin } from "@patchwork/plugins";
import { openAIProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";
import { stepAction, addDocumentToAgentAction } from "./actions";

export const plugins: Plugin<any>[] = [
  openAIProvider,
  anthropicProvider,
  {
    type: "patchwork:datatype",
    id: "agent",
    name: "Agent",
    icon: "Bot",
    async load() {
      const { AgentDataType } = await import("./datatype");
      return AgentDataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "agent",
    name: "Agent",
    icon: "Bot",
    supportedDataTypes: ["agent"],
    async load() {
      const { renderAgent } = await import("./AgentView");
      return renderAgent;
    },
  },
  stepAction,
  addDocumentToAgentAction,
];

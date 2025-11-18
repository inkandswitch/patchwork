import { type DocHandle, type Repo } from "@automerge/automerge-repo";
import { type Plugin } from "@patchwork/plugins";
import { type ChatDocument } from "./types";

// Action to create and attach a new agent
export const createAgentAction: Plugin<any> = {
  type: "patchwork:action",
  id: "chat-create-agent",
  name: "Create Agent",
  icon: "BotMessageSquare",
  supportedDataTypes: ["chat"],
  module: {
    isApplicable: () => true,
    default: async (handle: DocHandle<ChatDocument>, repo: Repo) => {
      // Create a new agent document
      const agentHandle = repo.create<any>();

      // Initialize the agent document with the agent datatype
      agentHandle.change((doc) => {
        doc["@patchwork"] = {
          type: "agent",
          title: "Agent",
        };
        doc.modelId = "claude-sonnet-4-0";
        doc.chatDocUrl = handle.url;
        doc.activeDocUrls = [];
      });

      // Attach the agent to the chat
      handle.change((doc) => {
        if (!doc.agentDocUrls) {
          doc.agentDocUrls = [];
        }
        doc.agentDocUrls.push(agentHandle.url);
      });
    },
  },
};

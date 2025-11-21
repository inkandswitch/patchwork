import { type DocHandle, type Repo } from "@automerge/automerge-repo";
import { type Plugin } from "@patchwork/plugins";
import { type ChatDocument } from "./types";
import { type AgentDocument } from "../../agent/src/Agent";
import { type HasPatchworkMetadata } from "@patchwork/filesystem";
import { type TodoDoc } from "../../todo/src/Todo";

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

      const todoDocHandle = repo.create<TodoDoc & HasPatchworkMetadata>({
        "@patchwork": {
          type: "todo",
        },
        title: "Agent Tasks",
        todos: [],
      });
      const agentHandle = repo.create<AgentDocument & HasPatchworkMetadata>({
        "@patchwork": {
          type: "agent",
        },
        modelId: "claude-sonnet-4-0",
        chatDocUrl: handle.url,
        activeDocUrls: [],
        todoListUrl: todoDocHandle.url,
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

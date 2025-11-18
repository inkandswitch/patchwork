import { type Plugin } from "@patchwork/plugins";
import { type DocHandle, type Repo } from "@automerge/automerge-repo";
import { type AgentDocument, step } from "./Agent";

// Step the agent (run one turn of the agent)
export const stepAction: Plugin<any> = {
  type: "patchwork:action",
  id: "agent-step",
  name: "Step Agent",
  icon: "Play",
  supportedDataTypes: ["agent"],
  module: {
    default: async (handle: DocHandle<AgentDocument>, repo: Repo) => {
      // Call the step function with the agent document URL
      await step(handle.url, repo);
    },
  },
};

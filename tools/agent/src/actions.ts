import { type Plugin } from "@patchwork/plugins";
import {
  AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import { type AgentDocument, step } from "./Agent";
import * as z from "zod";

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

// Action to add a document to an agent's active documents
export const addDocumentToAgentAction: Plugin<any> = {
  type: "patchwork:action",
  id: "agent-add-document",
  name: "Add Document to Agent",
  icon: "FilePlus",
  supportedDataTypes: ["agent"],
  module: {
    argsSchema: () => {
      return z.object({
        documentUrl: z
          .string()
          .describe("The Automerge URL of the document to add to the agent"),
      });
    },
    default: async (
      handle: DocHandle<AgentDocument>,
      repo: Repo,
      args: { documentUrl: string }
    ) => {
      try {
        const docUrl = args.documentUrl as AutomergeUrl;

        // Verify the document exists
        const targetDocHandle = await repo.find(docUrl as any);
        const targetDoc = targetDocHandle.doc();

        if (!targetDoc) {
          throw new Error(`Document not found: ${docUrl}`);
        }

        // Add the document URL to the agent's activeDocUrls if not already present
        handle.change((doc) => {
          if (!doc.activeDocUrls) {
            doc.activeDocUrls = [];
          }

          // Check if already added
          if (!doc.activeDocUrls.includes(docUrl)) {
            doc.activeDocUrls.push(docUrl);
            console.log(`Added document to agent: ${docUrl}`);
          } else {
            console.log(`Document already in agent: ${docUrl}`);
          }
        });
      } catch (err) {
        console.error("Error adding document to agent:", err);
        throw err;
      }
    },
  },
};

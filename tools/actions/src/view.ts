// Action to view the entire document content
import { DocHandle, Repo } from "@automerge/automerge-repo";
import { type Plugin } from "@patchwork/plugins";

export const viewDocumentAction: Plugin<any> = {
  type: "patchwork:action",
  id: "chat-view-document",
  name: "View Document",
  icon: "Eye",
  supportedDataTypes: ["chat"],
  module: {
    isApplicable: () => true,
    default: async (handle: DocHandle<unknown>, repo: Repo) => {
      // Get the current document state
      const doc = handle.doc();

      // Return the entire document content as a string
      return JSON.stringify(doc, null, 2);
    },
  },
};

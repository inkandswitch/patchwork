import { type Plugin, getRegistry } from "@patchwork/plugins";
import { type DocHandle } from "@automerge/automerge-repo";
import { type Repo } from "@automerge/automerge-repo";
import { z } from "zod";

export const createDocumentAction: Plugin<any> = {
  type: "patchwork:action",
  id: "create-document",
  name: "Create Document",
  icon: "FilePlus",
  supportedDataTypes: ["*"],
  module: {
    argsSchema: () => {
      return z.object({
        dataType: z
          .string()
          .describe("The type of document to create (e.g., 'counter', 'essay', 'map')"),
        title: z
          .string()
          .optional()
          .describe("Optional title for the new document"),
      });
    },
    default: async (
      handle: DocHandle<any>,
      repo: Repo,
      args: { dataType: string; title?: string }
    ) => {
      try {
        // Get the datatype plugin
        const registry = getRegistry("patchwork:datatype");
        const datatypePlugin = await registry.load(args.dataType);

        if (!datatypePlugin) {
          throw new Error(`Datatype "${args.dataType}" not found`);
        }

        // Create a new document
        const newHandle = repo.create<any>();

        // Initialize the document with the datatype
        const dataTypeImpl = datatypePlugin.module;
        if (dataTypeImpl.init) {
          newHandle.change((doc) => {
            // Set the patchwork metadata
            doc["@patchwork"] = {
              type: args.dataType,
            };

            // Call the datatype's init function
            dataTypeImpl.init(doc, repo);

            // Set title if provided
            if (args.title && dataTypeImpl.setTitle) {
              dataTypeImpl.setTitle(doc, args.title);
            }
          });
        }

        // Add a reference to the new document in the current document
        // This creates a link that can be opened
        handle.change((doc) => {
          if (!doc.createdDocuments) {
            doc.createdDocuments = [];
          }
          doc.createdDocuments.push({
            url: newHandle.url,
            type: args.dataType,
            title: args.title || `New ${args.dataType}`,
            createdAt: new Date().toISOString(),
          });
        });

        console.log(`Created new ${args.dataType} document:`, newHandle.url);
      } catch (err) {
        console.error("Error creating document:", err);
        throw err;
      }
    },
  },
};


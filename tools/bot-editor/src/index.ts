import { type Plugin } from "@patchwork/plugins";
import { openAIProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "bot-editor",
    name: "Bot Editor",
    icon: "Bot",
    supportedDataTypes: ["account"],
    async load() {
      const { renderBotEditor } = await import("./BotEditor");
      return renderBotEditor;
    },
  },
  {
    type: "patchwork:ai-prompt",
    id: "json-ai-prompt",
    name: "Generic JSON Editor",
    datatypeId: "*",
    async load() {
      return {
        docToText: (doc: unknown) => JSON.stringify(doc, null, 2),
        textToDoc: (text: string) => JSON.parse(text),
        prompt: `You are an AI assistant helping to edit JSON documents.
When the user asks for changes, follow these steps:
1. If there is significant ambiguity, ask clarifying questions.
2. Otherwise, propose your edits by providing the complete new document text within edit tags, like this:

<edit>
{
  "complete": "json document",
  "goes": "here"
}
</edit>

Keep your edits focused on the requested changes while preserving the rest of the document structure.
You MUST use the <edit> tags to wrap your edits!
The content inside the edit tags MUST be valid JSON.`,
        edit: async (handle: any, newContent: any) => {
          handle.change((doc: any) => {
            Object.entries(newContent).forEach(([key, value]) => {
              doc[key] = value;
            });
          });
        },
      };
    },
  },
  openAIProvider,
  anthropicProvider,
];

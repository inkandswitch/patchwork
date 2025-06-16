import { DocHandle, Repo, updateText } from "@automerge/automerge-repo";
import { DataType } from "./datatypes";
import { getMatchingPlugins, registerPlugins, LoadedPlugin } from "./plugins";

export type AIEditPromptDescription = {
  id: string;
  name: string;
  type: "patchwork:ai-prompt";
  datatypeId: string | "*";
};

export type AIEditPromptImplementation<D = unknown> = {
  docToText?: (doc: D) => string;
  textToDoc?: (text: string) => D;
  prompt: string;
  edit: (handle: DocHandle<D>, newContent: any, repo: Repo) => Promise<void>;
};

export type AIEditPrompt<D = unknown> = LoadedPlugin<
  AIEditPromptDescription,
  AIEditPromptImplementation<D>
>;

export const isAIEditPrompt = (value: unknown): value is AIEditPrompt => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "patchwork:ai-prompt"
  );
};

/**
 * Get all AI prompts available for a specific datatype
 * @param datatype The datatype to get prompts for
 * @returns Array of prompts, including generic prompts and datatype-specific ones
 */
export const getAIPromptsForDatatype = (datatype: DataType): AIEditPrompt[] => {
  const { plugins } = getMatchingPlugins<AIEditPrompt>({
    pluginType: "patchwork:ai-prompt",
    matchField: "datatypeId",
    matchValue: datatype.id,
    sortField: "name",
  });
  return plugins;
};

/**
 * Get the default AI prompt for a datatype
 * Prefers datatype-specific prompts over generic ones
 */
export const getDefaultAIPromptForDatatype = (
  datatype: DataType
): AIEditPrompt | undefined => {
  const prompts = getAIPromptsForDatatype(datatype);
  // Prefer datatype-specific prompts over generic ones
  return prompts.find((p) => p.datatypeId === datatype.id) || prompts[0];
};

// Generic JSON fallback prompt that works for any datatype
export const jsonAIPrompt: AIEditPrompt = {
  id: "json-ai-prompt",
  name: "Generic JSON Editor",
  type: "patchwork:ai-prompt",
  datatypeId: "*",
  module: {
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
    edit: async (handle: DocHandle<unknown>, newContent: any) => {
      handle.change((doc) => {
        // For each key in the new content, update the doc
        Object.entries(newContent).forEach(([key, value]) => {
          (doc as any)[key] = value;
        });
      });
    },
  },
};

// Register the generic JSON prompt
registerPlugins([jsonAIPrompt], "aiPrompts.ts");

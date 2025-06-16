import { DocHandle, updateText } from "@automerge/automerge-repo";
import { AIEditPrompt } from "@patchwork/sdk";
import { MarkdownDoc } from "./datatype";

export const essayAIPrompt: AIEditPrompt<MarkdownDoc> = {
  id: "essay-ai-prompt",
  name: "Essay Editor",
  type: "patchwork:ai-prompt",
  datatypeId: "essay",
  module: {
    docToText: (doc: MarkdownDoc) => doc.content || "",
    /** @ts-expect-error todo: it's mad because we don't have version control metadata on here, think about what to do */
    textToDoc: (text: string) => ({ content: text, title: "Untitled" }),
    prompt: `You are an AI assistant helping to edit text documents.
When the user asks for changes, follow these steps:
1. If there is significant ambiguity, ask clarifying questions.
2. Otherwise, propose your edits by writing a very brief explanation of the changes you made and then providing the complete new document text within edit tags, like this:

---
I edited the introduction to be more concise:
<edit>
[Complete new document text goes here]
</edit>
---

Keep your edits focused on the requested changes while preserving the rest of the document.
You MUST use the <edit> tags to wrap your edits!`,
    edit: async (
      handle: DocHandle<MarkdownDoc>,
      newContent: { content: string }
    ) => {
      handle.change((doc) => {
        updateText(doc, ["content"], newContent.content);
      });
    },
  },
};

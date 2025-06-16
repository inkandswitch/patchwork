import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import { type DataType } from "../datatypes";
import { chatCompletion } from "./index";
import { LLMChatMessage } from "./types";
import { createBranch } from "../versionControl/branches";
import { HasVersionControlMetadata } from "../versionControl/schema";
import { ModelId } from "./types";
import { getDefaultAIPromptForDatatype, AIEditPrompt } from "../aiPrompts";
import { getMatchingPlugins } from "../plugins";

// A bot that helps edit documents
export const EDITOR_BOT_CONTACT_URL =
  "automerge:QprGUET1kXHD76mMmg7p7Q9TD1R" as AutomergeUrl;

export type UserMessage = { role: "user"; content: string };
export type AssistantMessage = {
  role: "assistant";
  content: string;
  branchUrl?: AutomergeUrl;
};

export type ChatMessage = UserMessage | AssistantMessage;

// Type for documents that have bot chat history
export interface HasBotChatHistory {
  botChatHistory: ChatMessage[];
  botModelId: string;
  botPromptId: string;
}

// Helper to parse edit XML
const parseEditXML = (xml: string) => {
  const match = xml.match(/<edit>([\s\S]*?)<\/edit>/);
  if (!match) {
    throw new Error("Invalid edit XML format");
  }
  return match[1].trim();
};

// Helper to update branch URL on a doc's chat history
const updateBranchUrlForAssistantMessage = (
  docHandle: DocHandle<HasBotChatHistory>,
  branchUrl: AutomergeUrl
) => {
  docHandle.change((d) => {
    const lastAssistantMessage = d.botChatHistory
      .slice()
      .reverse()
      .find((msg) => msg.role === "assistant") as AssistantMessage;
    if (lastAssistantMessage) {
      lastAssistantMessage.branchUrl = branchUrl;
    }
  });
};

export const makeBotEdits = async ({
  targetDocHandle,
  chatHistory,
  dataType,
  repo,
  modelId,
  promptId,
}: {
  targetDocHandle: DocHandle<any>;
  chatHistory: ChatMessage[];
  dataType: DataType;
  repo: Repo;
  modelId?: ModelId;
  promptId?: string;
}): Promise<AutomergeUrl | null> => {
  // Get the appropriate AI prompt for this datatype
  const prompt = promptId
    ? (
        await getMatchingPlugins<AIEditPrompt>({
          pluginType: "patchwork:ai-prompt",
          matchField: "id",
          matchValue: promptId,
        })
      ).plugins[0].module
    : getDefaultAIPromptForDatatype(dataType)?.module;

  if (!prompt) {
    throw new Error(`No AI prompt available for datatype: ${dataType.id}`);
  }

  // Convert the document to text using the prompt's converter
  const docText =
    prompt.docToText?.(targetDocHandle.doc()) ??
    JSON.stringify(targetDocHandle.doc(), null, 2);

  const messages: LLMChatMessage[] = [
    {
      role: "system",
      content: prompt.prompt,
    },
    ...chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content || "",
    })),
    {
      role: "user",
      content: `Current document contents:
${docText}`,
    },
  ];

  const response = await chatCompletion(messages, { model: modelId });

  // Strip any edits out of the response for the purposes of chat history
  const cleanedResponse = response.replace(
    /<edit>[\s\S]*?<\/edit>/g,
    (match) => {
      return ``;
    }
  );

  const assistantMessage: AssistantMessage = {
    role: "assistant",
    content: cleanedResponse,
  };

  // Store the message in chat history
  targetDocHandle.change((d: any) => {
    d.botChatHistory.push(assistantMessage);
  });

  // Check if response contains an edit
  if (!response.includes("<edit>")) {
    return null;
  }

  try {
    const editText = parseEditXML(response);
    const newContent = prompt.textToDoc?.(editText) ?? JSON.parse(editText);

    // Create a new branch for the edit
    const branchMetadataHandle = await createBranch({
      repo,
      branchScopeHandle: targetDocHandle as DocHandle<
        HasVersionControlMetadata<unknown, unknown>
      >,
      dataTypeId: dataType.id,
      createdBy: EDITOR_BOT_CONTACT_URL,
      name: "Edit document",
    });

    // Update branch URL on the original doc
    updateBranchUrlForAssistantMessage(
      targetDocHandle as DocHandle<HasBotChatHistory>,
      branchMetadataHandle.url
    );

    // Get the clone URL and update it
    const branchMetadataDoc = branchMetadataHandle.doc();
    if (!branchMetadataDoc) {
      throw new Error(
        `Branch metadata doc missing at ${branchMetadataHandle.url}`
      );
    }
    const cloneUrl = branchMetadataDoc.clones[targetDocHandle.url]?.url;
    if (!cloneUrl) {
      throw new Error(`Clone URL missing for ${targetDocHandle.url}`);
    }

    // Update the clone with the new content
    const cloneHandle = await repo.find<HasBotChatHistory>(cloneUrl);

    // Update branch URL on the clone's chat history
    updateBranchUrlForAssistantMessage(cloneHandle, branchMetadataHandle.url);

    // Apply the edit to the clone using the prompt's edit function
    await prompt.edit(cloneHandle, newContent, repo);

    return branchMetadataHandle.url;
  } catch (e) {
    console.error("Failed to process edit:", e);
    return null;
  }
};

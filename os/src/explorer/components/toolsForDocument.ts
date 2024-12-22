import { Tool, toolsForDataType } from "@patchwork/sdk";
import type { HasPatchworkMetadata } from "@patchwork/sdk/modules/types";

const getSuggestedTools = async (document: HasPatchworkMetadata): Tool[] => {
  const patchworkMetadata = document["@patchwork"];
  if (!patchworkMetadata) {
    return [];
  }
  const suggestedImportUrl = patchworkMetadata.suggestedImportUrl;
  if (!suggestedImportUrl) {
    return [];
  }
  const module = await import(suggestedImportUrl);
  return module.tools || [];
};

export const toolsForDocument = async (
  document: HasPatchworkMetadata,
  dataTypeId: string
): Promise<Tool[]> => {
  dataTypeId ||= document["@patchwork"]?.type || "unknown";
  const registeredTools = toolsForDataType(dataTypeId);
  const suggestedTools = getSuggestedTools(document);

  return [...suggestedTools, ...registeredTools];
};

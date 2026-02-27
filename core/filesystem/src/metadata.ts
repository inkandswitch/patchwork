import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

export type HasPatchworkMetadata<Type extends string = string> = {
  "@patchwork": {
    type: Type;
    suggestedImportUrl?: string;
    copies?: AutomergeUrl[];
    copyOf?: AutomergeUrl;
  };
};

export function getType(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.type;
}

export function getSuggestedImportUrl(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.suggestedImportUrl;
}

export function getCopies(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copies || [];
}

export function getCopyOf(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copyOf;
}

export type ToolSource = {
  branch?: string;
  sourceDocUrl?: string;
};

/**
 * Get tool source metadata from a document.
 * Stub: branching is not yet implemented, always returns undefined.
 */
export function getToolSource(
  _doc: Partial<HasPatchworkMetadata>
): ToolSource | undefined {
  return undefined;
}

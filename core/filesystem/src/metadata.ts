import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

export type ToolSource = {
  /** Plain URL for branch-following, versioned URL (with #heads) for pinned */
  packageUrl: AutomergeUrl;
  /** Present = follow this branch as it moves, absent = pinned to heads in packageUrl */
  branch?: string;
};

export type HasPatchworkMetadata<Type extends string = string> = {
  "@patchwork": {
    type: Type;
    suggestedImportUrl?: string;
    toolSource?: ToolSource;
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

export function getToolSource(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.toolSource;
}

export function getCopies(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copies || [];
}

export function getCopyOf(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copyOf;
}

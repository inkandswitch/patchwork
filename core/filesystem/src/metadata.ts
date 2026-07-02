import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

export type HasPatchworkMetadata<Type extends string = string> = {
  "@patchwork": {
    type: Type;
    copies?: AutomergeUrl[];
    copyOf?: AutomergeUrl;
    history?: AutomergeUrl;
  };
};

export function getType(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.type;
}

export function getCopies(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copies || [];
}

export function getCopyOf(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copyOf;
}

import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

export type HasPatchworkMetadata<Type extends string = string> = {
  "@patchwork": {
    type: Type;
    suggestedImportUrl?: string;
    copies?: AutomergeUrl[];
    copyOf?: AutomergeUrl;
    history?: AutomergeUrl;
  };
};

export function getType(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.type;
}

/**
 * A `suggestedImportUrl` is only honored when it's an `http:`/`https:` URL —
 * i.e. a directly-importable module bundle. This keeps automerge/other-scheme
 * values from ever being treated as modules, both when written and read.
 */
export function isHttpUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function getSuggestedImportUrl(doc: Partial<HasPatchworkMetadata>) {
  const url = doc["@patchwork"]?.suggestedImportUrl;
  return isHttpUrl(url) ? url : undefined;
}

export function getCopies(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copies || [];
}

export function getCopyOf(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.copyOf;
}

export type HasPatchworkMetadata = {
  "@patchwork": {
    type: string;
    suggestedImportUrl?: string;
  };
};

export function getType(doc: HasPatchworkMetadata) {
  return doc["@patchwork"].type;
}

export function getSuggestedImportUrl(doc: Partial<HasPatchworkMetadata>) {
  return doc["@patchwork"]?.suggestedImportUrl;
}

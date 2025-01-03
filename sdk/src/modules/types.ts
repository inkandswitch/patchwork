import { AutomergeUrl } from "@automerge/automerge-repo";

export type ModuleSettingsDoc = {
  modules: AutomergeUrl[];
};

export type HasPatchworkMetadata = {
  "@patchwork": {
    type: string;
    suggestedImportUrl?: string;
  };
};

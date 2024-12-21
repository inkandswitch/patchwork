export type ModuleSettingsDoc = {
  modules: string[];
};

export type HasPatchworkMetadata = {
  "@patchwork": {
    type: string;
    suggestedImportUrl: string;
  };
};

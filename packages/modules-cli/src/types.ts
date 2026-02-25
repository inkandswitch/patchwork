import type { AutomergeUrl } from "@automerge/automerge-repo";

export type TagPointer = {
  heads: string[];
};

export type ModuleEntry = {
  tags: Record<string, TagPointer>;
};

export type ModuleSettingsDoc = {
  modules: Record<AutomergeUrl, ModuleEntry>;
  "@patchwork": { type: "patchwork:module-settings" };
};

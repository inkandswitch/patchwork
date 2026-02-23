import type { AutomergeUrl } from "@automerge/automerge-repo";

export type BranchPointer = {
  heads: string[];
};

export type ModuleEntry = {
  branches: Record<string, BranchPointer>;
};

export type ModuleSettingsDoc = {
  modules: Record<AutomergeUrl, ModuleEntry>;
  "@patchwork": { type: "patchwork:module-settings" };
};

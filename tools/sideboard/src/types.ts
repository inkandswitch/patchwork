import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";

export interface PatchworkToolProps<T> {
  handle: DocHandle<T>;
  repo: Repo;
}

export type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
};

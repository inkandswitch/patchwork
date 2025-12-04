import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type { PatchworkViewElement } from "@patchwork/elements";

export interface PatchworkToolProps<T> {
  handle: DocHandle<T>;
  repo: Repo;
  element: PatchworkViewElement;
}

export type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
};

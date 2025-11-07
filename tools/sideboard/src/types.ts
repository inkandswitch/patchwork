import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type { PatchworkViewElement } from "@patchwork/element";

export interface PatchworkToolProps<T> {
  handle: DocHandle<T>;
  repo: Repo;
  element: PatchworkViewElement;
}

export type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
};

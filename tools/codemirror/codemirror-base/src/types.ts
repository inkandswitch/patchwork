import type { DocHandle, Repo } from "@automerge/automerge-repo";

export interface PatchworkToolProps<T> {
  handle: DocHandle<T>;
  repo: Repo;
}

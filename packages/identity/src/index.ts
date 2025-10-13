import { Active } from "@automerge/automerge-repo-keyhive";
import {
  AutomergeUrl,
  Repo,
  StorageAdapterInterface,
} from "@automerge/automerge-repo";

export * from "./keyhive";

export async function getOrCreateAccountUrl(options: {
  active: Active;
  storage: StorageAdapterInterface;
  repo: Repo;
}) {
  let url = localStorage.getItem("patchworkAccountUrl") as
    | AutomergeUrl
    | undefined;

  if (!url) {
    const account = options.repo.create({
      id: options.active.peerId as string,
      app: {},
      rootFolderUrl: "automerge:3BZwYTmuB9yeyb4bCJ1HwL9uzLz8",
      documents: [],
    });
    localStorage.setItem("patchworkAccountUrl", account.url);
    url = account.url;
  }

  return url;
}

import { Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { refresh } from "./refresh";

export async function watch(
  repo: Repo,
  { dir, projectFolderUrl, syncServerStorageId, patchworkUrl }: CommandLineArgs
) {
  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }

  while (true) {
    console.log("Refreshing...");
    // TODO: debouncing? all the standard questions about re-run policy
    await refresh(repo, { dir, projectFolderUrl, syncServerStorageId, patchworkUrl });
    // TODO: curiously, this seems necessary to pick up changes...
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

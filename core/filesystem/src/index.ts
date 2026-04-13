import { type DocHandle, type DocumentProgress, type Repo } from "@automerge/automerge-repo";
import type { FolderDoc } from "./types.js";

export * from "./metadata.js";
export * from "./module-watcher.js";
export * from "./packages.js";
export * from "./urls.js";
export type * from "./types.js";

/**
 *
 * @param repo an Automerge Repo
 * @param folderHandle the folder handle
 * @param parts the path.split("/")

 */
export async function findHandleInFolderHandle<T>(
  repo: Repo,
  folderHandle: DocHandle<FolderDoc>,
  parts: string[]
) {
  if (!parts.length) return folderHandle;
  const part = parts[0];
  if (!part) return folderHandle;
  const folder = folderHandle.doc();
  if (!folder.docs) return;

  const docLink = folder.docs.find((doc) => doc.name === part);
  if (!docLink) return;

  const docHandle = await waitForProgress(repo.findWithProgress(docLink.url), 60_000);

  if (parts.length > 1) {
    const doc = docHandle.doc();
    if (!("docs" in doc)) {
      return;
    }
    return findHandleInFolderHandle(
      repo,
      docHandle as DocHandle<FolderDoc>,
      parts.slice(1)
    );
  }
  // todo kind of a lie
  return docHandle as DocHandle<T>;
}

function waitForProgress<T>(
  progress: DocumentProgress<T>,
  timeoutMs: number,
): Promise<DocHandle<T>> {
  const state = progress.peek();
  if (state.state === "ready") return Promise.resolve(state.handle);

  return new Promise<DocHandle<T>>((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      const current = progress.peek();
      if (current.state === "ready") {
        resolve(current.handle);
      } else {
        reject(new Error(`Document timed out (state=${current.state})`));
      }
    }, timeoutMs);

    const unsubscribe = progress.subscribe((state) => {
      if (state.state === "ready") {
        clearTimeout(timer);
        unsubscribe();
        resolve(state.handle);
      }
    });
  });
}

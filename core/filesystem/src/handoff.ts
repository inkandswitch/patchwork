import {
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import type { UnixFileEntry, FolderDoc } from "./types.js";
import type { HandoffHandler } from "@patchwork/bootloader";

export async function findFileHandleInFolderHandle(
  repo: Repo,
  folder: DocHandle<FolderDoc>,
  parts: string[]
) {
  if (!parts.length) {
    return folder;
  }

  const partsLength = parts.length;
  for (const [index, part] of parts.entries()) {
    const f = folder.doc();

    const target = f.docs.find((link) => link.name == part);
    if (!isValidAutomergeUrl(target?.url)) {
      throw new Error(
        `couldn't find ${part} in ${f.title} (resolving ${parts.join("/")} in ${folder.url})`
      );
    }
    const fileHandle = await repo.find<UnixFileEntry>(target.url);
    if (index == partsLength - 1) {
      return fileHandle as DocHandle<UnixFileEntry>;
    } else {
      folder = fileHandle as unknown as DocHandle<FolderDoc>;
    }
  }
}

export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  return `/${encodeURIComponent(automergeUrl)}/`;
}

export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  return automergeUrlToServiceWorkerUrl(handle.url);
}

export function createFilesystemHandoffHandler(repo: Repo) {
  const handle: HandoffHandler = async (href) => {
    try {
      const [maybeAutomergeUrl, ...path] = href.split("/");

      if (isValidAutomergeUrl(maybeAutomergeUrl)) {
        const folder = await repo.find<FolderDoc>(maybeAutomergeUrl);

        const { heads } = parseAutomergeUrl(maybeAutomergeUrl);

        if (!heads) {
          const url = stringifyAutomergeUrl({
            documentId: folder.documentId,
            heads: folder.heads(),
          });

          return {
            status: 307,
            headers: {
              location: `/${encodeURIComponent(url)}/${path.join("/")}`,
            },
            cache: false,
          };
        }

        const file = (await findFileHandleInFolderHandle(
          repo,
          folder,
          path.map(decodeURIComponent)
        )) as DocHandle<UnixFileEntry>;

        return {
          body: file?.doc().content,
          headers: {
            "content-type": file.doc().mimeType ?? "text/plain",
          } as Record<string, string>,
        };
      }
    } catch (error) {
      console.error({ error });
      return {
        body: `${error}`,
        status: 567,
      } as const;
    }
  };

  return handle;
}

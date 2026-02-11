import {
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import type { UnixFileEntry, FolderDoc } from "./types.js";
import type { HandoffHandler } from "@inkandswitch/patchwork-bootloader/types";
import debug from "debug";
import { packageJsonContentsFromFolderDocUrl } from "./packages.js";
const log = debug("patchwork:filesystem:handoff");

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

    if (!f.docs) {
      throw new Error(
        `folder at ${folder.url} has no docs array. (resolving ${parts.join("/")})`
      );
    }

    const target = f.docs.find((link) => link.name == part);
    if (!isValidAutomergeUrl(target?.url)) {
      throw new Error(
        `couldn't find ${part} in folder with title "${f.title}". (resolving ${parts.join("/")} in folder at ${folder.url})`
      );
    }
    if (log.enabled) {
      const { heads, documentId } = parseAutomergeUrl(target.url);
      const h = await repo.find(documentId);
      const latestHeads = h.heads();
      if (heads && heads.join("|") !== latestHeads.join("|")) {
        log(
          `${target.url} is not latest. requested heads: ${heads}, latest heads: ${latestHeads}`
        );
      }
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

const loaders: Record<AutomergeUrl, Record<string, string>> = {};

export function createFilesystemHandoffHandler(repo: Repo) {
  const handle: HandoffHandler = async (href, request) => {
    try {
      const [maybeAutomergeUrl, ...path] = href.split("/");
      log(`recieved handoff request for ${href}`);
      if (isValidAutomergeUrl(maybeAutomergeUrl)) {
        const folder = await repo.find<FolderDoc>(maybeAutomergeUrl);
        if (!path[path.length - 1]) {
          path.pop();
        }

        const { heads } = parseAutomergeUrl(maybeAutomergeUrl);

        if (heads && heads.join("|") !== folder.heads()?.join("|")) {
          log(
            `serving ${maybeAutomergeUrl}. latest heads are ${folder.heads()}`
          );
        }

        if (!heads) {
          const latestHeads = folder.heads();
          log(`redirecting ${maybeAutomergeUrl} to ${latestHeads}`);
          const url = stringifyAutomergeUrl({
            documentId: folder.documentId,
            heads: latestHeads,
          });

          let location = `/${encodeURIComponent(url)}`;
          if (path.length) {
            location += `/${path.join("/")}`;
          }

          return {
            status: 307,
            headers: {
              location,
            },
            cache: false,
          };
        }

        const file = (await findFileHandleInFolderHandle(
          repo,
          folder,
          path.map(decodeURIComponent)
        )) as DocHandle<UnixFileEntry>;

        const doc = file?.doc();

        let content = doc?.content;
        let mimeType = doc?.mimeType ?? "text/plain";

        if (!content) {
          throw new Error(
            `file at ${href} (url: ${file?.doc()}, heads: ${file?.heads()}) has no content`
          );
        }

        const key = maybeAutomergeUrl;
        if (!(key in loaders)) {
          const pkg = await packageJsonContentsFromFolderDocUrl(key);
          const patchworkField = pkg?.["patchwork"];
          if (!patchworkField) {
            loaders[key] = false;
          } else {
            loaders[key] = patchworkField.loaders;
          }
        }

        if (loaders[key]) {
          const ext = doc.extension ?? path[path.length - 1].split(".")[0];
          if (ext in loaders[key]) {
            const loader = await import(loaders[key][ext]);
            const loaded = await loader.default({
              ...request,
              url: href,
              content: content.toString(),
            });
            content = loaded.content;
            mimeType = loaded.contentType ?? "application/javascript";
          }
        }

        return {
          body:
            content instanceof Uint8Array
              ? (content as Uint8Array<ArrayBuffer>)
              : content.toString(),
          headers: {
            "content-type": mimeType,
          } as Record<string, string>,
        };
      }
    } catch (error) {
      console.error({ error });
      return {
        body: `${error}`,
        status: 567,
        cache: false,
      } as const;
    }
  };

  return handle;
}

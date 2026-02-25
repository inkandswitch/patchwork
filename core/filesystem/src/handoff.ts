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
const log = debug("patchwork:filesystem:handoff");

/**
 * Check if a string looks like an automerge URL (either standard or darn format).
 *
 * Standard automerge URLs use bs58check encoding of 16 bytes (~27 chars).
 * Darn URLs use plain bs58 encoding of 32 bytes (~44 chars).
 * Both start with "automerge:".
 */
function isAutomergeUrlLike(url: unknown): url is AutomergeUrl {
  // Handle non-string types (e.g., Automerge Text objects)
  if (typeof url !== "string") {
    // Try to convert to string if it has toString
    if (url && typeof (url as any).toString === "function") {
      const str = (url as any).toString();
      if (typeof str === "string" && str.startsWith("automerge:")) {
        return isAutomergeUrlLike(str);
      }
    }
    return false;
  }

  if (!url.startsWith("automerge:")) return false;

  // Accept standard automerge URLs
  if (isValidAutomergeUrl(url)) return true;

  // Accept darn-style URLs (longer, plain bs58 encoded 32-byte IDs)
  const encoded = url.slice("automerge:".length).split("#")[0];
  // Plain bs58 of 32 bytes is ~43-44 chars
  if (encoded.length >= 40 && encoded.length <= 50) {
    // Basic bs58 character validation
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(encoded);
  }

  return false;
}

let refreshTimeout: NodeJS.Timeout;

export async function uncache(match: string) {
  let matched = false;
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      if (request.url.includes(match)) {
        matched = true;
        cache.delete(request);
      }
    }
  }
  return matched;
}

/**
 * Wait for a document to have a specific property.
 * This handles the case where the document is syncing and initially empty.
 */
async function waitForDocProperty<T, K extends keyof T>(
  handle: DocHandle<T>,
  property: K,
  timeoutMs = 10000
): Promise<T> {
  const doc = handle.doc();
  if (doc && doc[property] !== undefined) {
    return doc;
  }

  // Wait for the document to sync
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Timeout waiting for ${handle.url} to have ${String(property)}`
        )
      );
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      handle.off("change", onChange);
    };

    const onChange = () => {
      const doc = handle.doc();
      if (doc && doc[property] !== undefined) {
        cleanup();
        resolve(doc);
      }
    };

    handle.on("change", onChange);

    // Check again in case it changed while setting up listener
    const currentDoc = handle.doc();
    if (currentDoc && currentDoc[property] !== undefined) {
      cleanup();
      resolve(currentDoc);
    }
  });
}

/**
 * Wait for a folder document to have a `docs` array.
 */
async function waitForFolderDocs(
  folder: DocHandle<FolderDoc>,
  timeoutMs = 10000
): Promise<FolderDoc> {
  return waitForDocProperty(folder, "docs", timeoutMs);
}

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
    const f = await waitForFolderDocs(folder);

    if (!f.docs) {
      throw new Error(
        `folder at ${folder.url} has no docs array. (resolving ${parts.join("/")})`
      );
    }

    const target = f.docs.find((link) => String(link.name) == part);
    if (!isAutomergeUrlLike(target?.url)) {
      throw new Error(
        `couldn't find ${part} in folder with title "${f.title}". (resolving ${parts.join("/")} in folder at ${folder.url})`
      );
    }
    // Coerce to primitive string in case Automerge returns an ImmutableString object
    const targetUrl = String(target.url) as AutomergeUrl;
    if (log.enabled && isValidAutomergeUrl(targetUrl)) {
      // Only do heads comparison for standard automerge URLs
      const { heads, documentId } = parseAutomergeUrl(targetUrl);
      const h = await repo.find(documentId);
      const latestHeads = h.heads();
      if (heads && heads.join("|") !== latestHeads.join("|")) {
        log(
          `${targetUrl} is not latest. requested heads: ${heads}, latest heads: ${latestHeads}`
        );
      }
    }
    const fileHandle = await repo.find<UnixFileEntry>(targetUrl);
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
  const handle: HandoffHandler = async (href, _request) => {
    try {
      const [maybeAutomergeUrl, ...path] = href.split("/");
      log(`recieved handoff request for ${href}`);
      if (isAutomergeUrlLike(maybeAutomergeUrl)) {
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

        // Wait for file content to sync
        const fileDoc = await waitForDocProperty(file, "content");
        const content = fileDoc.content;

        if (!content) {
          throw new Error(
            `file at ${href} (url: ${file?.url}, heads: ${file?.heads()}) has no content`
          );
        }

        return {
          body:
            content instanceof Uint8Array
              ? (content as Uint8Array<ArrayBuffer>)
              : content.toString(),
          headers: {
            "content-type": String(file.doc().mimeType ?? "text/plain"),
          } as Record<string, string>,
        };
      }
    } catch (error) {
      console.error({ error });
      const [maybeAutomergeUrl] = href.split("/");
      const key = maybeAutomergeUrl.slice(
        "automerge:".length,
        maybeAutomergeUrl.indexOf("#")
      );
      const cleared = await uncache(key);
      console.info(`uncached ${key}`, cleared ? "refresh?" : "");
      // clearTimeout(refreshTimeout);
      // if (cleared) {
      // refreshTimeout = setTimeout(() => {
      //   cleared && location.reload();
      // }, 4000);
      //}
      return {
        body: `${error}`,
        status: 567,
        cache: false,
      } as const;
    }
  };

  return handle;
}

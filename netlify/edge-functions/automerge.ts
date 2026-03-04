import { automergeWasmBase64 } from "@automerge/automerge/automerge.wasm.base64";
import {
  initializeBase64Wasm,
  Repo,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo/slim";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { getHeads } from "@automerge/automerge/slim";

await initializeBase64Wasm(automergeWasmBase64);

type FolderDoc = {
  title: string;
  docs: { name: string; type: string; url: AutomergeUrl }[];
};

type UnixFileEntry = {
  content: string | Uint8Array;
  extension: string;
  mimeType: string;
  name: string;
};

async function findFile(
  repo: Repo,
  folder: DocHandle<FolderDoc>,
  parts: string[]
): Promise<DocHandle<UnixFileEntry> | undefined> {
  if (!parts.length) return folder as unknown as DocHandle<UnixFileEntry>;

  for (const [index, part] of parts.entries()) {
    const doc = folder.docSync();
    if (!doc?.docs) return undefined;

    const target = doc.docs.find((link) => link.name === part);
    if (!target?.url || !isValidAutomergeUrl(target.url)) return undefined;

    const handle = repo.find<any>(target.url);
    await handle.whenReady();

    if (index === parts.length - 1) {
      return handle as DocHandle<UnixFileEntry>;
    }
    folder = handle as DocHandle<FolderDoc>;
  }
}

const SYNC_SERVER = "wss://sync3.automerge.org";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // decode the URI-encoded pathname: /automerge%3AdocId%23heads/path/to/file
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname.slice(1));
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const [maybeAutomergeUrl, ...pathParts] = decoded.split("/");

  if (!isValidAutomergeUrl(maybeAutomergeUrl)) {
    return new Response("not an automerge URL", { status: 400 });
  }

  // strip trailing empty path segment
  if (pathParts.length && !pathParts[pathParts.length - 1]) {
    pathParts.pop();
  }

  const { heads, documentId } = parseAutomergeUrl(maybeAutomergeUrl);

  try {
    const repo = new Repo({
      network: [new WebSocketClientAdapter(SYNC_SERVER)],
    });

    try {
      const folderHandle = repo.find<FolderDoc>(maybeAutomergeUrl);
      await folderHandle.whenReady();

      // if no heads pinned, redirect to the latest heads
      if (!heads) {
        const latestHeads = getHeads(folderHandle.docSync()!);
        const pinnedUrl = stringifyAutomergeUrl({
          documentId,
          heads: latestHeads,
        });
        let location = `/${encodeURIComponent(pinnedUrl)}`;
        if (pathParts.length) {
          location += `/${pathParts.join("/")}`;
        }
        return new Response(null, {
          status: 307,
          headers: { location },
        });
      }

      const fileHandle = await findFile(
        repo,
        folderHandle,
        pathParts.map(decodeURIComponent)
      );

      if (!fileHandle) {
        return new Response("not found", { status: 404 });
      }

      const fileDoc = fileHandle.docSync() as UnixFileEntry | undefined;
      if (!fileDoc?.content) {
        return new Response("file has no content", { status: 404 });
      }

      const body =
        fileDoc.content instanceof Uint8Array
          ? fileDoc.content
          : fileDoc.content.toString();

      return new Response(body, {
        headers: {
          "content-type": fileDoc.mimeType ?? "text/plain",
          "cache-control": "public, max-age=31536000, immutable",
          "cross-origin-opener-policy": "same-origin",
          "cross-origin-embedder-policy": "unsafe-none",
        },
      });
    } finally {
      try { repo.shutdown(); } catch {}
    }
  } catch (error) {
    console.error("automerge edge function error:", error);
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    return new Response(`error: ${message}`, { status: 500 });
  }
}

export const config = {
  path: "/automerge%3A*",
};

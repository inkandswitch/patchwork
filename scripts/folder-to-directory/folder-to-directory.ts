/**
 * Flatten a folder doc into a directory doc.
 *
 * Walks the folder recursively, collecting every leaf docLink.url at its
 * slash-joined path. Creates a new doc with `@patchwork.type === "directory"`
 * and one key per leaf, e.g. `"main/dist/index.js": "automerge:..."`. Prints
 * the new doc url to stdout.
 *
 * If a second URL is passed and it points to an existing directory doc, the
 * directory is updated in place from the folder and `lastSyncAt` is bumped.
 *
 * Usage:
 *   folder-to-directory <automerge:folder-url>
 *   folder-to-directory <automerge:folder-url> <automerge:directory-url>
 *
 * Env: SUBDUCTION_SERVER, AUTOMERGE_DATA_DIR
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type {
  AutomergeUrl,
  DocHandle,
  Repo,
} from "@automerge/automerge-repo";

type DocLink = { name: string; type: string; url: AutomergeUrl };
type FolderDoc = { title?: string; docs?: DocLink[] };
type DirectoryDoc = {
  "@patchwork": { type: "directory" };
  lastSyncAt?: number;
  [path: string]: unknown;
};

const here = path.dirname(fileURLToPath(import.meta.url));

const USAGE = `Usage:
  folder-to-directory <automerge:folder-url>
  folder-to-directory <automerge:folder-url> <automerge:directory-url>

Env: SUBDUCTION_SERVER, AUTOMERGE_DATA_DIR`;

const AUTOMERGE_URL_RE = /^automerge:[1-9A-HJ-NP-Za-km-z]+$/;

function requireAutomergeUrl(label: string, value: string): AutomergeUrl {
  if (!AUTOMERGE_URL_RE.test(value)) {
    console.error(`Invalid ${label}: ${JSON.stringify(value)}`);
    process.exit(1);
  }
  return value as AutomergeUrl;
}

async function openRepo(): Promise<Repo> {
  const subductionServer =
    process.env.SUBDUCTION_SERVER ?? "wss://subduction.sync.inkandswitch.com";
  const dataDir = path.resolve(
    process.env.AUTOMERGE_DATA_DIR ?? path.join(here, "automerge-repo-data")
  );
  await mkdir(dataDir, { recursive: true });

  await import("@automerge/automerge-subduction");
  const { Repo } = await import("@automerge/automerge-repo");
  const { NodeFSStorageAdapter } = await import(
    "@automerge/automerge-repo-storage-nodefs"
  );

  return new Repo({
    storage: new NodeFSStorageAdapter(dataDir),
    subductionWebsocketEndpoints: [subductionServer],
  });
}

async function syncAndShutdown(repo: Repo) {
  await new Promise((r) => setTimeout(r, 1000));
  await repo.flush();
  await repo.shutdown();
  await new Promise((r) => setTimeout(r, 2500));
}

function isFolder(doc: unknown): doc is FolderDoc {
  return (
    !!doc &&
    typeof doc === "object" &&
    "docs" in doc &&
    Array.isArray((doc as { docs: unknown }).docs)
  );
}

function isDirectory(doc: unknown): doc is DirectoryDoc {
  if (!doc || typeof doc !== "object") return false;
  const meta = (doc as { "@patchwork"?: { type?: string } })["@patchwork"];
  return !!meta && meta.type === "directory";
}

async function walk(
  repo: Repo,
  handle: DocHandle<unknown>,
  prefix: string,
  out: Record<string, AutomergeUrl>
) {
  const doc = handle.doc();
  if (!isFolder(doc) || !doc.docs) return;

  for (const link of doc.docs) {
    const childPath = prefix ? `${prefix}/${link.name}` : link.name;
    const next = await repo.find(link.url);
    await next.whenReady();

    if (isFolder(next.doc())) {
      await walk(repo, next, childPath, out);
    } else {
      out[childPath] = link.url;
    }
  }
}

async function flattenFolder(
  repo: Repo,
  folderHandle: DocHandle<FolderDoc>
): Promise<Record<string, AutomergeUrl>> {
  const flat: Record<string, AutomergeUrl> = {};
  await walk(repo, folderHandle, "", flat);
  return flat;
}

async function create(repo: Repo, folderHandle: DocHandle<FolderDoc>) {
  const flat = await flattenFolder(repo, folderHandle);

  const directory = repo.create<DirectoryDoc>({
    "@patchwork": { type: "directory" },
    lastSyncAt: Date.now(),
    ...flat,
  });
  await directory.whenReady();

  console.error(
    `Flattened ${folderHandle.url} into directory with ${Object.keys(flat).length} entries: ${directory.url}`
  );
  console.log(directory.url);
}

async function update(
  repo: Repo,
  folderHandle: DocHandle<FolderDoc>,
  directoryHandle: DocHandle<DirectoryDoc>
) {
  const flat = await flattenFolder(repo, folderHandle);

  directoryHandle.change((doc) => {
    for (const key of Object.keys(doc)) {
      if (key === "@patchwork" || key === "lastSyncAt") continue;
      delete doc[key];
    }
    for (const [k, v] of Object.entries(flat)) {
      doc[k] = v;
    }
    doc.lastSyncAt = Date.now();
  });

  console.error(
    `Updated directory ${directoryHandle.url} with ${Object.keys(flat).length} entries from folder ${folderHandle.url}`
  );
  console.log(directoryHandle.url);
}

const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2) {
  console.error(USAGE);
  process.exit(1);
}

const urls = args.map((a, i) => requireAutomergeUrl(`URL #${i + 1}`, a));

const repo = await openRepo();
const handles = await Promise.all(urls.map((u) => repo.find(u)));
await Promise.all(handles.map((h) => h.whenReady()));

if (urls.length === 1) {
  if (!isFolder(handles[0].doc())) {
    console.error(`Single argument must be a folder URL`);
    process.exit(1);
  }
  await create(repo, handles[0] as DocHandle<FolderDoc>);
} else {
  const [a, b] = handles;
  const aFolder = isFolder(a.doc());
  const bFolder = isFolder(b.doc());
  const aDir = isDirectory(a.doc());
  const bDir = isDirectory(b.doc());

  let folderHandle: DocHandle<FolderDoc>;
  let directoryHandle: DocHandle<DirectoryDoc>;
  if (aFolder && bDir) {
    folderHandle = a as DocHandle<FolderDoc>;
    directoryHandle = b as DocHandle<DirectoryDoc>;
  } else if (bFolder && aDir) {
    folderHandle = b as DocHandle<FolderDoc>;
    directoryHandle = a as DocHandle<DirectoryDoc>;
  } else {
    console.error(
      "With two URLs, exactly one must be a folder and the other a directory"
    );
    process.exit(1);
  }

  await update(repo, folderHandle, directoryHandle);
}

await syncAndShutdown(repo);

// Subduction leaves the wss TLSSocket open after repo.shutdown(); exit explicitly.
process.exit(0);

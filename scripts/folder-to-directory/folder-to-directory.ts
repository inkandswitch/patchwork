/**
 * Flatten a folder doc into a directory doc.
 *
 * Walks the folder recursively, collecting every leaf docLink.url at its
 * slash-joined path. Creates a new doc with `@patchwork.type === "directory"`
 * and one key per leaf, e.g. `"main/dist/index.js": "automerge:..."`. Prints
 * the new doc url to stdout.
 *
 * Usage:
 *   folder-to-directory <automerge:folder-url>
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

const here = path.dirname(fileURLToPath(import.meta.url));

const USAGE = `Usage:
  folder-to-directory <automerge:folder-url>

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

async function flatten(folderUrl: AutomergeUrl) {
  const repo = await openRepo();
  const handle = await repo.find<FolderDoc>(folderUrl);
  await handle.whenReady();

  const flat: Record<string, AutomergeUrl> = {};
  await walk(repo, handle, "", flat);

  const directory = repo.create({
    "@patchwork": { type: "directory" },
    ...flat,
  });
  await directory.whenReady();

  const url = directory.url;
  await syncAndShutdown(repo);

  console.error(
    `Flattened ${folderUrl} into directory with ${Object.keys(flat).length} entries: ${url}`
  );
  console.log(url);
}

const [, , folderArg] = process.argv;
if (!folderArg) {
  console.error(USAGE);
  process.exit(1);
}

const folderUrl = requireAutomergeUrl("folder URL", folderArg);
await flatten(folderUrl);

// Subduction leaves the wss TLSSocket open after repo.shutdown(); exit explicitly.
process.exit(0);

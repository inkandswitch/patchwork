import * as FolderDataType from "@patchwork/folder";
import { FolderDoc } from "@patchwork/folder";
import { AutomergeUrl, PeerId, Repo } from "@automerge/automerge-repo";
import { DummyStorageAdapter } from "@automerge/automerge-repo/helpers/DummyStorageAdapter.js";
import * as fsP from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

// Automerge

export const makeRepo = () =>
  new Repo({
    peerId: "alice" as PeerId,
    network: [],
    storage: new DummyStorageAdapter(),
  });

// Patchwork

export type PatchworkFolderSpec = {
  title: string;
  docs: PatchworkDocLinkSpec[];
};

export type PatchworkDocLinkSpec = {
  name: string;
  type: string;
  url_linksTo: unknown;
};

export async function readPatchworkFolder(
  folderUrl: AutomergeUrl,
  repo: Repo
): Promise<PatchworkFolderSpec> {
  const folderHandle = await repo.find<FolderDoc>(folderUrl);
  const folderDoc = folderHandle.doc();
  if (!folderDoc) {
    throw new Error("Folder doc not found");
  }
  return {
    title: folderDoc.title,
    docs: await Promise.all(
      folderDoc.docs.map(async (docLink) => {
        if (docLink.type === "folder") {
          return {
            name: docLink.name,
            type: docLink.type,
            url_linksTo: await readPatchworkFolder(docLink.url, repo),
          };
        } else {
          return {
            name: docLink.name,
            type: docLink.type,
            url_linksTo: await readPatchworkDoc(
              docLink.url,
              docLink.type,
              repo
            ),
          };
        }
      })
    ),
  };
}

export async function readPatchworkDoc(
  url: AutomergeUrl,
  type: string,
  repo: Repo
) {
  const handle = await repo.find(url);
  const doc = handle.doc();
  if (!doc) {
    throw new Error("Doc not found");
  }
  return doc;
}

export function createPatchworkFolder(
  spec: PatchworkFolderSpec,
  repo: Repo
): AutomergeUrl {
  const folderHandle = repo.create<FolderDoc>();
  folderHandle.change((doc) => {
    // UGH: FolderDataType.init(doc, repo);
    doc.title = spec.title;
    doc.docs = spec.docs.map((docLinkSpec) => {
      const url =
        docLinkSpec.type === "folder"
          ? createPatchworkFolder(
              docLinkSpec.url_linksTo as PatchworkFolderSpec,
              repo
            )
          : repo.create(docLinkSpec.url_linksTo).url;
      const docLink = {
        ...docLinkSpec,
        url,
      };
      delete docLink.url_linksTo;
      return docLink;
    });
  });
  return folderHandle.url;
}

// Unix

export type UnixFolderContentsSpec = {
  fileName: string;
  content: string | Uint8Array | UnixFolderContentsSpec;
}[];

export const binaryData = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

export async function fillInUnixFolder(
  folderPath: string,
  content: UnixFolderContentsSpec
): Promise<void> {
  for (const entry of content) {
    const entryPath = path.join(folderPath, entry.fileName);
    if (
      typeof entry.content === "string" ||
      entry.content instanceof Uint8Array
    ) {
      await fsP.writeFile(entryPath, entry.content);
    } else {
      await fsP.mkdir(entryPath);
      await fillInUnixFolder(entryPath, entry.content);
    }
  }
}

export async function makeTempDir() {
  return fsP.mkdtemp(path.join(os.tmpdir(), "test-"));
}

export async function createUnixFolder(
  content: UnixFolderContentsSpec
): Promise<string> {
  const tempDir = await makeTempDir();
  await fillInUnixFolder(tempDir, content);
  return tempDir;
}

export async function readUnixFolder(
  folderPath: string
): Promise<UnixFolderContentsSpec> {
  const entries = await fsP.readdir(folderPath, { withFileTypes: true });
  return Promise.all(
    entries.map(async (entry) => ({
      fileName: entry.name,
      content: entry.isFile()
        ? await path.join(folderPath, entry.name) // XXX: TODO, fix up these tests
        : await readUnixFolder(path.join(folderPath, entry.name)),
    }))
  );
}

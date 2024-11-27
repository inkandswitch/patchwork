import {
  asyncCall,
  asyncPromise,
  fetchDoc,
} from "@patchwork/sdk/async-signals";
import { DocLink } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { fetchFolderDocWithMetadata } from "@/packages/folder/hooks/fetchFolderDocWithMetadata";
import { PeerId, Repo } from "@automerge/automerge-repo";
import { DummyStorageAdapter } from "@automerge/automerge-repo/helpers/DummyStorageAdapter.js";
import { beforeEach, describe, expect, it } from "vitest";

describe("fetchFolderDocWithMetadata", () => {
  let repo: Repo;

  const makeItem = (name: string) => {
    const handle = repo.create({
      content: "this is just some doc",
    });
    const link = {
      name,
      type: "content",
      url: handle.url,
    };
    return { handle, link };
  };

  const makeFolder = (title: string, docs: DocLink[] = []) => {
    const handle = repo.create({ title, docs });
    const link = {
      name: title,
      type: "folder",
      url: handle.url,
    };
    return { handle, link };
  };

  const getFolderDocWithMetadataSignal = (link: DocLink) =>
    asyncCall(fetchFolderDocWithMetadata, link.url, (path) =>
      fetchDoc(DocPath.toLink(path).url, repo)
    );

  beforeEach(() => {
    repo = new Repo({
      peerId: "alice" as PeerId,
      network: [],
      storage: new DummyStorageAdapter(),
    });
  });

  it("returns a top level folder with no nesting", async () => {
    const item1 = makeItem("Item 1");
    const root = makeFolder("Root", [item1.link]);

    const fdwmSignal = getFolderDocWithMetadataSignal(root.link);

    expect(await asyncPromise(fdwmSignal)).toEqual({
      doc: {
        title: "Root",
        docs: [item1.link],
      },
      flatDocPaths: [[root.link, item1.link]],
      rootFolderUrl: root.link.url,
    });
  });

  it("updates the return value when the folder changes", async () => {
    const item1 = makeItem("Item 1");
    const root = makeFolder("Root", [item1.link]);
    const fdwmSignal = getFolderDocWithMetadataSignal(root.link);
    expect(await asyncPromise(fdwmSignal)).toEqual({
      doc: {
        title: "Root",
        docs: [item1.link],
      },
      flatDocPaths: [[root.link, item1.link]],
      rootFolderUrl: root.link.url,
    });

    const item2 = makeItem("Item 2");
    root.handle.change((d) => d.docs.push(item2.link));
    expect(await asyncPromise(fdwmSignal)).toEqual({
      doc: {
        title: "Root",
        docs: [item1.link, item2.link],
      },
      flatDocPaths: [
        [root.link, item1.link],
        [root.link, item2.link],
      ],
      rootFolderUrl: root.link.url,
    });
  });

  it("handles a folder being added in an update", async () => {
    const item1 = makeItem("Item 1");
    const root = makeFolder("Root", [item1.link]);
    const fdwmSignal = getFolderDocWithMetadataSignal(root.link);
    expect(await asyncPromise(fdwmSignal)).toEqual({
      doc: {
        title: "Root",
        docs: [item1.link],
      },
      flatDocPaths: [[root.link, item1.link]],
      rootFolderUrl: root.link.url,
    });

    const folder = makeFolder("Folder", [item1.link]);
    root.handle.change((d) => d.docs.push(folder.link));
    expect(await asyncPromise(fdwmSignal)).toEqual({
      doc: {
        title: "Root",
        docs: [
          item1.link,
          {
            ...folder.link,
            folderContents: {
              title: "Folder",
              docs: [item1.link],
            },
          },
        ],
      },
      flatDocPaths: [
        [root.link, item1.link],
        [root.link, folder.link],
        [root.link, folder.link, item1.link],
      ],
      rootFolderUrl: root.link.url,
    });
  });

  it("traverses down two levels of nesting", async () => {
    const item1 = makeItem("Item 1");
    const item2 = makeItem("Item 1");
    const item3 = makeItem("Item 1");
    const subFolder = makeFolder("Sub Folder", [item3.link]);
    const folder = makeFolder("Folder", [item2.link, subFolder.link]);
    const root = makeFolder("Root", [item1.link, folder.link]);
    const fdwmSignal = getFolderDocWithMetadataSignal(root.link);
    expect(await asyncPromise(fdwmSignal)).toEqual({
      doc: {
        title: "Root",
        docs: [
          item1.link,
          {
            ...folder.link,
            folderContents: {
              title: "Folder",
              docs: [
                item2.link,
                {
                  ...subFolder.link,
                  folderContents: {
                    title: "Sub Folder",
                    docs: [item3.link],
                  },
                },
              ],
            },
          },
        ],
      },
      flatDocPaths: [
        [root.link, item1.link],
        [root.link, folder.link],
        [root.link, folder.link, item2.link],
        [root.link, folder.link, subFolder.link],
        [root.link, folder.link, subFolder.link, item3.link],
      ],
      rootFolderUrl: root.link.url,
    });
  });
});

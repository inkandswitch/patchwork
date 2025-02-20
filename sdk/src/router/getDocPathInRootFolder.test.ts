import { AutomergeUrl } from "@automerge/automerge-repo";
import { describe, expect, it } from "vitest";
import { DocLink, DocPath } from "./DocLink";
import { FolderDocWithMetadata } from "../versionControl/useFolderDocWithMetadata";
import { getDocPathInRootFolder } from "./getDocPathInRootFolder";

const mkFileLink = (url: string, type: string): DocLink => ({
  name: url,
  url: url as AutomergeUrl,
  type,
});

const mkFilePath = (urls: string[]): DocPath => {
  return urls.map((url, i) =>
    mkFileLink(url, i === urls.length - 1 ? "file" : "folder")
  );
};

describe("getDocPathInRootFolder", () => {
  it("resolves to the nearest option if there are several", () => {
    /* Example:
     *
     * Document2 is resolved
     *
     * Root Folder
     * |--- FolderA
     * |    |--- Document1 <-- previously selected
     * |    |--- Document2 <-- this document will be resolved
     * |
     * |--- FolderB
     * |    |--- Document3
     * |    |--- Document2
     */

    const rootFolderDocWithMetadata: FolderDocWithMetadata = {
      rootFolderUrl: undefined as any,
      doc: undefined as any,
      flatDocPaths: [
        mkFilePath(["Root Folder", "FolderB", "Document3"]),
        mkFilePath(["Root Folder", "FolderB", "Document2"]),
        mkFilePath(["Root Folder", "FolderA", "Document1"]),
        mkFilePath(["Root Folder", "FolderA", "Document2"]),
      ],
    };

    const previousSelectedDocPath = mkFilePath([
      "Root Folder",
      "FolderA",
      "Document1",
    ]);

    const urlParams = {
      url: "Document2" as AutomergeUrl,
      type: "file",
    };

    const result = getDocPathInRootFolder(
      urlParams,
      rootFolderDocWithMetadata,
      previousSelectedDocPath
    );

    expect(result).toEqual(mkFilePath(["Root Folder", "FolderA", "Document2"]));
  });
});

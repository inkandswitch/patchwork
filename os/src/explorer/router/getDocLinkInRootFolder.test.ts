import { AutomergeUrl } from "@automerge/automerge-repo";
import { describe, expect, it } from "vitest";
import { DocLinkWithFolderPath } from "../../packages/folder/datatype";
import { FolderDocWithMetadata } from "../../packages/folder/hooks/useFolderDocWithChildren";
import { getDocLinkInRootFolder } from "./getDocLinkInRootFolder";

const mkFile = (url: string, folderPath: string[]): DocLinkWithFolderPath => ({
  name: url,
  url: url as AutomergeUrl,
  type: "file" as const,
  folderPath: folderPath as AutomergeUrl[],
});

describe("getDocLinkInRootFolder", () => {
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
      flatDocLinks: [
        mkFile("Document3", ["Root Folder", "FolderB"]),
        mkFile("Document2", ["Root Folder", "FolderB"]),
        mkFile("Document1", ["Root Folder", "FolderA"]),
        mkFile("Document2", ["Root Folder", "FolderA"]),
      ],
    };

    const previousSelectedDocLink: DocLinkWithFolderPath = mkFile("Document1", [
      "Root Folder",
      "FolderA",
    ]);

    const urlParams = {
      url: "Document2" as AutomergeUrl,
      type: "file",
    };

    const result = getDocLinkInRootFolder(
      urlParams,
      rootFolderDocWithMetadata,
      previousSelectedDocLink
    );

    expect(result).toEqual({
      name: "Document2",
      url: "Document2",
      type: "file",
      folderPath: ["Root Folder", "FolderA"],
    });
  });
});

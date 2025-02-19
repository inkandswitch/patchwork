import { isEqual } from "lodash-es";
import { DocLink, DocPath, DocPathUtils } from "./DocLink";
import { FolderDocWithMetadata } from "../borrowed-bits/FolderDoc";
import { URLParams } from "./types";

/*
 * getDocPathInRootFolder resolves an url + type in the root folder of the user
 *
 * If the same document is linked multiple times in the folder hierarchy this function will open
 * the document that's closest to the previously selected document
 *
 * Example:
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
export const getDocPathInRootFolder = (
  { url, type }: DocLink | URLParams,
  rootFolderDocWithMetadata: FolderDocWithMetadata,
  previousSelectedDocPath: DocPath | undefined
): DocPath | undefined => {
  // try to match urlParams to docLink in root folder
  const matches = rootFolderDocWithMetadata.flatDocPaths.filter((docPath) => {
    const link = DocPathUtils.toLink(docPath);
    return link.url === url && link.type === type;
  });

  if (matches.length === 0) {
    return;
  }

  if (matches.length === 1) {
    return matches[0];
  }

  // if we have multiple matches bias towards links that have overlap with the previous selection
  // otherwise just return the first link

  const previousFolderPath =
    previousSelectedDocPath && DocPathUtils.folder(previousSelectedDocPath);

  if (previousFolderPath) {
    for (let i = previousFolderPath.length; i >= 0; i--) {
      const comparisonPath = previousFolderPath.slice(0, i);

      const maybeLinkInPath = matches.find((match) =>
        isEqual(DocPathUtils.parent(match), comparisonPath)
      );

      if (maybeLinkInPath) {
        return maybeLinkInPath;
      }
    }
  }

  return matches[0];
};

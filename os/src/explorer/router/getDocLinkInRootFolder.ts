import { DocLink, DocLinkWithFolderPath } from "../../packages/folder/datatype";
import { isEqual } from "lodash";
import { URLParams } from "./types";
import { FolderDocWithMetadata } from "../../packages/folder/hooks/useFolderDocWithChildren";
import { AutomergeUrl } from "@automerge/automerge-repo";

/*
 * getDocLinkInRootFolder resolves an url + type in the root folder of the user
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
export const getDocLinkInRootFolder = (
  { url, type }: DocLink | URLParams,
  rootFolderDocWithMetadata: FolderDocWithMetadata,
  previousSelectedDocLink: DocLinkWithFolderPath | undefined
): DocLinkWithFolderPath | undefined => {
  // try to match urlParams to docLink in root folder
  const matches = rootFolderDocWithMetadata.flatDocLinks.filter(
    (doc) => doc.url === url && doc.type === type
  );

  if (matches.length === 0) {
    return;
  }

  if (matches.length === 1) {
    return matches[0];
  }

  // if we have multiple matches bias towards links that have overlap with the previous selection
  // otherwise just return the first link

  const previousFolderPath: AutomergeUrl[] = previousSelectedDocLink
    ? previousSelectedDocLink.type == "folder"
      ? previousSelectedDocLink.folderPath.concat(previousSelectedDocLink.url)
      : previousSelectedDocLink.folderPath
    : [];

  let linkInPath: DocLinkWithFolderPath | undefined;

  for (let i = previousFolderPath.length; i >= 0; i--) {
    const comparisonPath = previousFolderPath.slice(0, i);

    const maybeLinkInPath = matches.find((match) =>
      isEqual(match.folderPath, comparisonPath)
    );

    if (maybeLinkInPath) {
      linkInPath = maybeLinkInPath;
      break;
    }
  }

  return linkInPath ?? matches[0];
};

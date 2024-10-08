import {
  DocMissingError,
  fetchAwaitMissing,
  fetchMap,
  useAsyncComputed,
} from "@/async-signals";
import { Account, useCurrentAccount } from "@/explorer/account";
import {
  fetchOmOnFixedBranch,
  fetchOmOnActiveBranch,
} from "@/versionControl/signals";
import { AutomergeUrl, Doc, Repo } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { last } from "lodash";
import { useCallback } from "react";
import {
  DocLink,
  DocPath,
  FolderDoc,
  FolderDocMaterialized,
} from "../datatype";
import { DataType, useDataTypes } from "@/sdk";

/**
 * Kinda a convenience type, bundling a (materialized) FolderDoc with
 * some other useful stuff.
 */
export type FolderDocWithMetadata = {
  doc: FolderDocMaterialized;
  rootFolderUrl: AutomergeUrl;
  flatDocPaths: DocPath[];
};

/**
 * Given a materialized FolderDocWithChildren (at a given DocPath),
 * computes a flat list of all DocPaths contained in it (including
 * nested folders).
 */
const flattenDocPaths = ({
  docPath,
  folderDoc,
}: {
  docPath: DocPath;
  folderDoc: FolderDocMaterialized;
}): DocPath[] => {
  return folderDoc.docs.flatMap((docLink) => {
    // folderDoc is materialized, so docLink might have
    // folderContents; no reason to include that in the docPath.
    const docLinkCopy = { ...docLink };
    delete docLinkCopy.folderContents;
    const childPath = [...docPath, docLinkCopy];
    return [
      childPath,
      ...(docLink.type === "folder" && docLink.folderContents
        ? flattenDocPaths({
            docPath: childPath,
            folderDoc: docLink.folderContents,
          })
        : []),
    ];
  });
};

/**
 * Given a DocPath to a folder, recursively expands out the folder's
 * contents to produce a FolderDocWithChildren.
 */
function fetchMaterializeFolderDoc(
  docPath: DocPath,
  fetchDoc: (docPath: DocPath) => Doc<unknown>
): FolderDocMaterialized {
  try {
    const folder = fetchDoc(docPath) as Doc<FolderDoc>;

    return {
      ...folder,
      docs:
        fetchMap(folder.docs, (link) => {
          if (link.type === "folder") {
            const folderContents = fetchMaterializeFolderDoc(
              [...docPath, link],
              fetchDoc
            );
            // cast is ok cuz if it's loading, we won't return result
            return { ...link, folderContents };
          } else {
            return link;
          }
        }) ?? [],
    };
  } catch (e) {
    // If the doc is missing, return dummy data to unblock rendering something in the UI.
    // TODO: we could return an explicit marker that the doc is still loading and
    // figure out how to render that in the UI.
    if (e instanceof DocMissingError) {
      return {
        title: "Loading...",
        docs: [],
      } as unknown as FolderDocMaterialized;
    }

    // Any other error gets forwarded up -- including DocLoading, which is just an indicator
    // to the reactive system that a doc is still loading.
    throw e;
  }
}

export function fetchFolderDocWithMetadata(
  rootFolderUrl: AutomergeUrl,
  fetchDoc: (docPath: DocPath) => Doc<unknown>
): FolderDocWithMetadata {
  const rootDocPath = DocPath.forRoot(rootFolderUrl);
  const materializedDoc = fetchMaterializeFolderDoc(rootDocPath, fetchDoc);
  const flatDocPaths = flattenDocPaths({
    folderDoc: materializedDoc,
    docPath: rootDocPath,
  });
  return {
    doc: materializedDoc,
    rootFolderUrl,
    flatDocPaths,
  };
}

export function fetchFolderDocWithMetadataOnFixedBranch(
  rootFolderUrl: AutomergeUrl,
  branchUrl: AutomergeUrl | undefined,
  repo: Repo
): FolderDocWithMetadata {
  return fetchFolderDocWithMetadata(rootFolderUrl, (path) => {
    const docLink = last(path) as DocLink;
    return fetchOmOnFixedBranch(docLink.url, branchUrl, repo).doc;
  });
}

export function fetchFolderDocWithMetadataOnActiveBranch(
  rootFolderUrl: AutomergeUrl,
  account: Account,
  repo: Repo,
  dataTypes: DataType[]
) {
  return fetchFolderDocWithMetadata(rootFolderUrl, (docPath: DocPath) => {
    return fetchOmOnActiveBranch(docPath, account, repo, dataTypes).doc;
  });
}

// This hook recursively traverses a tree of nested folders and loads folder contents.
export function useFolderDocWithMetadataOnActiveBranch(
  rootFolderUrl: AutomergeUrl | undefined
): FolderDocWithMetadata | undefined {
  const repo = useRepo();
  const account = useCurrentAccount();
  const dataTypes = useDataTypes();
  return useAsyncComputed(
    useCallback(() => {
      fetchAwaitMissing(rootFolderUrl && account);
      return fetchFolderDocWithMetadataOnActiveBranch(
        rootFolderUrl,
        account,
        repo,
        dataTypes
      );
    }, [rootFolderUrl, account, repo, dataTypes])
  ).ifPending(undefined).value;
}

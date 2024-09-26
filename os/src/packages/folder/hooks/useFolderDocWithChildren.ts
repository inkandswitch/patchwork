import { DocMissingError, fetchMap, useAsyncComputed } from "@/async-signals";
import { useCurrentAccount } from "@/explorer/account";
import {
  fakeDocPath,
  fetchOmOnFixedBranch,
  fetchOmOnBranchFromPath,
} from "@/versionControl/signals";
import { AutomergeUrl, Doc, Repo } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { last } from "lodash";
import { useCallback } from "react";
import {
  DocLink,
  DocLinkWithFolderPath,
  DocPath,
  FolderDoc,
  FolderDocWithChildren,
} from "../datatype";

export type FolderDocWithMetadata = {
  rootFolderUrl: AutomergeUrl;
  flatDocLinks: DocLinkWithFolderPath[];
  doc: FolderDocWithChildren;
};

// Returns a flattened list of doc links in the folder tree, as an easy lookup index.
// Each doclink also gets annotated with its parent in the tree.
// NB: This returns undefined until we've recursively loaded all folders in our tree.
// The reason is that when we load a new doc, we need to decide whether to load it from an
// existing place in our folder hierarchy, or to create a new link to it in the root folder.
// We can't make this determination before recursively loading folder contents.
const computeFlattenedDocLinks = ({
  folderPath,
  doc,
}: {
  folderPath: AutomergeUrl[];
  doc: FolderDocWithChildren;
}): DocLinkWithFolderPath[] => {
  return doc.docs.flatMap((docLink) =>
    docLink.type === "folder" && docLink.folderContents
      ? [
          { ...docLink, folderPath },
          ...(computeFlattenedDocLinks({
            doc: docLink.folderContents,
            folderPath: [...folderPath, docLink.url],
          }) ?? []),
        ]
      : { ...docLink, folderPath }
  );
};

// TODO: reactive but not incremental
function fetchMaterializeFolderDoc(
  docPath: DocPath,
  fetchDocOnBranch: (docPath: DocPath) => Doc<unknown>
): FolderDocWithChildren {
  try {
    const folder = fetchDocOnBranch(docPath) as Doc<FolderDoc>;

    return {
      ...folder,
      docs:
        fetchMap(folder.docs, (link) => {
          if (link.type === "folder") {
            const folderContents = fetchMaterializeFolderDoc(
              [...docPath, link],
              fetchDocOnBranch
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
      } as unknown as FolderDocWithChildren;
    }

    // Any other error gets forwarded up -- including DocLoading, which is just an indicator
    // to the reactive system that a doc is still loading.
    throw e;
  }
}

export function fetchFolderDocWithChildren(
  rootFolderUrl: AutomergeUrl,
  getDocOnBranchFromPath: (docPath: DocPath) => Doc<unknown>
): FolderDocWithMetadata {
  const rootDocPath = fakeDocPath({
    url: rootFolderUrl,
    name: "root",
    type: "folder",
    folderPath: [],
  });
  const docWithLinks = fetchMaterializeFolderDoc(
    rootDocPath,
    getDocOnBranchFromPath
  );
  const flatDocLinks = computeFlattenedDocLinks({
    doc: docWithLinks,
    folderPath: [rootFolderUrl],
  });
  return {
    doc: docWithLinks,
    rootFolderUrl,
    flatDocLinks,
  };
}

export function fetchFolderDocWithChildrenOnFixedBranch(
  rootFolderUrl: AutomergeUrl,
  branchUrl: AutomergeUrl | undefined,
  repo: Repo
): FolderDocWithMetadata {
  return fetchFolderDocWithChildren(rootFolderUrl, (path) => {
    const docLink = last(path) as DocLink;
    return fetchOmOnFixedBranch(docLink.url, branchUrl, repo).doc;
  });
}

// This hook recursively traverses a tree of nested folders and loads folder contents.
export function useFolderDocWithChildren(
  rootFolderUrl: AutomergeUrl | undefined
): FolderDocWithMetadata | undefined {
  const repo = useRepo();
  const account = useCurrentAccount();
  return useAsyncComputed(
    useCallback(() => {
      if (!rootFolderUrl) return undefined;
      const getDocOnBranchFromPath = (docPath: DocPath) => {
        return fetchOmOnBranchFromPath(docPath, account, repo).doc;
      };
      return fetchFolderDocWithChildren(rootFolderUrl, getDocOnBranchFromPath);
    }, [rootFolderUrl, account, repo])
  ).ifPending(undefined);
}

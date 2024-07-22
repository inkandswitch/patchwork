import { UIStateDoc, useUIStateHandle } from "@/explorer/account";
import { Om } from "@/om";
import { isLoaded, parallelMap, throwIfMissing, useUsesDocs } from "@/signals";
import { fakeDocPath } from "@/versionControl/components/VersionControlEditor";
import { branchScopeAndActiveBranchInfo } from "@/versionControl/signals";
import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useMemo } from "react";
import {
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
}): DocLinkWithFolderPath[] | undefined => {
  return doc?.docs.flatMap((docLink) =>
    docLink.type === "folder" && docLink.folderContents
      ? [
          { ...docLink, folderPath: folderPath },
          ...computeFlattenedDocLinks({
            doc: docLink.folderContents,
            folderPath: [...folderPath, docLink.url],
          }) ?? [],
        ]
      : { ...docLink, folderPath }
  );
};

// TODO: reactive but not incremental
function materializeFolderDoc(
  docPath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>,
  repo: Repo,
): FolderDocWithChildren {
  const branchScopeAndActiveBranchInfo_ = branchScopeAndActiveBranchInfo(docPath, uiStateHandle, repo);

  const folderOm = branchScopeAndActiveBranchInfo_.cloneOrMainOm as Om<FolderDoc>;
  const folder = folderOm.doc;

  return {
    ...folder,
    docs:
      parallelMap(folder.docs, (link) => {
        if (link.type === "folder") {
          const folderContents = materializeFolderDoc([...docPath, link], uiStateHandle, repo);
          // cast is ok cuz if it's loading, we won't return result
          return { ...link, folderContents };
        } else {
          return link;
        }
      }) ?? [],
  };
}

// This hook recursively traverses a tree of nested folders and loads folder contents.
export function useFolderDocWithChildren(
  rootFolderUrl: AutomergeUrl | undefined
): FolderDocWithMetadata {
  const repo = useRepo();
  const uiStateHandle = useUIStateHandle();
  // TODO: this is v weird; id dunno how our docpaths relate to the root folder
  const rootDocPath = useMemo(() =>
    fakeDocPath({url: rootFolderUrl, name: 'root', type: 'folder', folderPath: []}),
    [rootFolderUrl]
  );
  const docWithLinks = useUsesDocs(useCallback(() => {
    return materializeFolderDoc(rootDocPath, uiStateHandle, repo);
  }, [rootDocPath, uiStateHandle, repo]));

  throwIfMissing(docWithLinks);


  // flatDocLinks is a flat array of all the docs in the hierarchy
  const flatDocLinks = useMemo(
    () =>
      isLoaded(docWithLinks) ? computeFlattenedDocLinks({
        doc: docWithLinks,
        folderPath: [rootFolderUrl],
      }) : undefined,
    [docWithLinks, rootFolderUrl]
  );

  return {
    doc: isLoaded(docWithLinks) ? docWithLinks : undefined,
    rootFolderUrl,
    flatDocLinks,
  };
}

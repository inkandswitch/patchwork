import { OmSig } from "@/signals";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useMemo } from "react";
import { computed, Signal } from "signia";
import { useValue } from "signia-react";
import {
  DocLinkWithFolderPath,
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
          }),
        ]
      : { ...docLink, folderPath }
  );
};

// TODO: reactive but not incremental
function materializeFolderDocSig(
  folderUrl: AutomergeUrl | undefined,
  repo: Repo,
): Signal<FolderDocWithChildren | 'loading'> {
  const folderOmSig = OmSig<FolderDoc>(folderUrl, repo);

  return computed(`materializeFolderDocSig:${folderUrl}`, () => {
    const folderOm = folderOmSig.value;
    const folder = folderOm?.doc;
    if (!folder) {
      return 'loading';
    }
    let somethingLoading = false;
    const result = {
      ...folder,
      docs:
        folder.docs?.map((link) => {
          if (link.type === "folder") {
            const folderContents = materializeFolderDocSig(link.url, repo).value;
            if (folderContents === 'loading') {
              somethingLoading = true;
            }
            // cast is ok cuz if it's loading, we won't return result
            return { ...link, folderContents: folderContents as FolderDocWithChildren };
          } else {
            return link;
          }
        }) ?? [],
    };
    return somethingLoading ? 'loading' : result;
  });
}

// This hook recursively traverses a tree of nested folders and loads folder contents.
export function useFolderDocWithChildren(
  rootFolderUrl: AutomergeUrl | undefined
): FolderDocWithMetadata {
  const repo = useRepo();
  const docWithLinks = useValue(useMemo(() =>
    materializeFolderDocSig(rootFolderUrl, repo),
    [rootFolderUrl, repo]
  ));

  // flatDocLinks is a flat array of all the docs in the hierarchy
  const flatDocLinks = useMemo(
    () =>
      docWithLinks === 'loading' ? undefined : computeFlattenedDocLinks({
        doc: docWithLinks,
        folderPath: [rootFolderUrl],
      }),
    [docWithLinks, rootFolderUrl]
  );

  return {
    doc: docWithLinks === 'loading' ? undefined : docWithLinks,
    rootFolderUrl,
    flatDocLinks,
  };
}

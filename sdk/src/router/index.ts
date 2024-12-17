import { dataTypeById } from "..";
import { useStaticCallback } from "../hooks/useStaticCallback";
import { DocLink, DocPathUtils, FolderDoc } from "@patchwork/folder";
import { DocPath } from "@patchwork/folder";
import { FolderDocWithMetadata } from "@patchwork/folder/hooks/fetchFolderDocWithMetadata";
import { setActiveBranchUrl } from "../versionControl";
import { BranchDoc } from "../versionControl";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useEffect, useState } from "react";
import { useUIStateOm } from "./uiState";
import { useCurrentUrl } from "./url";
import { getDocPathInRootFolder } from "./getDocPathInRootFolder";
import { URLParams } from "./types";
import { parseLegacyUrl, parseUrl, toUrl } from "./urls";
import { useSelectedDocPathState } from "./useSelectedDocPathState";

export {
  type SidebarMode,
  type MainViewMode,
  type UIStateDoc,
  useUIStateOm,
  useDocUIState,
  useToolUIState,
} from "./uiState";
export { toHashUrl, parseUrl, getUrlSafeName } from "./urls";

/*
 * useRouter
 *
 * HOW IT WORKS
 *
 * The router hook syncs the selected document to the url so you can
 * copy and paste the url to share the currently selected document
 * with someone else. This seems simple enough but there are a couple
 * of complications:
 *
 * The url only contains the url of the document not it's path in the
 * folder hierarchy. This is necessary so users can share documents
 * that are deeply nested in their folder hierarchy without exposing
 * their whole folder structure. But this means that the url of the
 * document is not enough to pin point a single document. The same
 * document might be linked multiple times in the same folder
 * structure. There are two ways the selected document can change:
 *
 * 1. **url changes** In this case we lookup the document in the
 *    folder structure of the user and add it to the top if it
 *    doesn't exist
 * 2. **setSelectedDocLink is called** In this case we need to make
 *    sure that url is update to reflect the new document
 *
 * Keeping the url and the selectedDoc link state in sync is
 * encapsulated in the `useSelectedDocLinkState`
 *
 * Another complication are branches. A document can exist in a
 * branch scope which might be the document itself or a folder above
 * it. Which branch is checked out on a branch scope is stored in the
 * UIStateDoc of the user. This state can also change if a branch is
 * checked out in a separate browser session. More obscurely it's
 * also possible that a document that wasn't in branch scope before
 * gets a branch when folder that it's contained in is turned into a
 * branch scope. We need to make sure that the url always shows the
 * currently selected branch and if an url is pasted in that the
 * correct branch is checked out.
 *
 * - the helper hook `useSelectedDocLinkState` syncs the current
 *   branchScope with the selected branch to the url and returns the
 *   activeBranchUrl and activeBranchScopeUrl
 * - in useRouter we compare activeBranchUrl und activeBranchScopeUrl
 *   if they match up the current url. If not we call
 *   `resolveUrlToDocPath`
 *
 * HOW TO TEST IT
 *
 * Currently we don't have any automatic test so for now if you
 * change the routing code here is a list of things you should test
 *
 * - paste a link into a browser sessions that doesn't have the
 *   document
 *  - a document with no branch scope
 *  - a document where the branch scope is the document itself
 *    - checked out on main
 *    - checked out on a branch
 *  - a document where the branch scope is a folder in which it's
 *    contained
 *    - checked out on main
 *    - checked out on a branch
 *
 * - paste a link into a browser sessions that does have the document
 *   but a different doc is selected
 *  - a document with no branch scope
 *  - a document where the branch scope is the document itself
 *    - checked out on main
 *    - checked out on a branch
 *  - a document where the branch scope is a folder in which it's
 *    contained
 *    - checked out on main
 *    - checked out on a branch
 *
 * - paste a link into a browser sessions that does have the document
 *   but a the same doc is selected on a different branch
 *  - a document where the branch scope is the document itself
 *    - checked out on main
 *    - checked out on a branch
 *  - a document where the branch scope is a folder in which it's
 *    contained
 *    - checked out on main
 *    - checked out on a branch
 *
 * - create a new branch on a document
 *
 * - have the same document open in two separate browser sessions
 *   logged in to the same profile
 *  - change the branch, see that it's correctly reflected in the url
 *    of the other
 *
 * - create a document on a branch
 *  - check it out main to see that the it redirects to a 404 page
 * - create a document on main
 *  - check out a previously created branch to see that it redirects to a 404 page
 *
 * - copy and paste an url that points to a 404 page and see that it loads correctly
 *
 */

export const useRouter = ({
  rootFolderDocWithMetadata,
}: {
  rootFolderDocWithMetadata: FolderDocWithMetadata | undefined;
}): {
  selectedDocPath: DocPath | undefined;
  // todo: should the folder path be optional?
  selectDocPath: (docPath: DocPath | undefined) => void;
} => {
  const repo = useRepo();
  const {
    selectedDocPath,
    selectDocPath,
    activeBranchUrl,
    activeBranchScopeUrl,
  } = useSelectedDocPathState();

  const selectedDocLink =
    selectedDocPath && DocPathUtils.toLink(selectedDocPath);

  const uiStateOm = useUIStateOm();

  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (rootFolderDocWithMetadata && uiStateOm) {
      setIsLoaded(true);
    }
  }, [rootFolderDocWithMetadata, uiStateOm]);

  /* resolveUrlToDocPath is called whenever a new document selection
   * was triggered by an url change.
   *
   * This function resolve the document url (with an optional branch
   * / branchScope) to a docLink in the root folder. If the user
   * doesn't have the document / branchScopeDoc in their root folder
   * we add the document / branchscope to the top of it.
   *
   * If the url contains a branch scope / branch url this function
   * ensures that the right branch is checked out. This changes the
   * checked out branch for all other sessions of the logged in user.
   *
   * for details on how the resolution of urls in the root folder
   * works see: getDocPathInRootFolder
   */
  const resolveUrlToDocPath = useStaticCallback(
    async (urlParams: URLParams) => {
      if (!uiStateOm || !rootFolderDocWithMetadata) {
        return;
      }

      // clear selectedDocPath if url params are empty
      if (!urlParams) {
        selectDocPath(undefined);
        return;
      }

      let branchDoc: BranchDoc | undefined;
      if (urlParams.branchUrl) {
        branchDoc = await repo.find<BranchDoc>(urlParams.branchUrl).doc();

        if (!branchDoc) {
          alert(`Could not find branch ${urlParams.branchUrl}`);
          return;
        }
      }

      const branchScopeUrl = branchDoc
        ? branchDoc.branchScopeUrl
        : urlParams.branchScopeUrl;

      const isBranchScopeASeparateDoc = branchScopeUrl !== urlParams.url;

      // hack: we don't know the dataType of the branch scope but in practice we only have two cases
      // - branchScope is the document itself -> type of document
      // - branchscope is a folder that contains the document -> "folder"
      const branchScopeType = isBranchScopeASeparateDoc
        ? "folder"
        : urlParams.type;

      const branchScopePathInRootFolder = branchScopeUrl
        ? getDocPathInRootFolder(
            { type: branchScopeType, url: branchScopeUrl },
            rootFolderDocWithMetadata,
            selectedDocPath
          )
        : undefined;

      // make sure that the branch scope doc is in the root folder and that the right branch is checked out
      if (branchScopeUrl) {
        if (!branchScopePathInRootFolder) {
          const folderDataType = dataTypeById("folder")!;

          const branchScopeHandle = repo.find<FolderDoc>(branchScopeUrl);
          const title = await folderDataType.getTitle(
            await branchScopeHandle.doc(),
            repo
          );

          repo
            .find<FolderDoc>(rootFolderDocWithMetadata.rootFolderUrl)
            .change((doc) => {
              doc.docs.unshift({
                type: branchScopeType,
                name: title,
                url: branchScopeUrl,
              });
            });

          // if the branchScope is a separated doc we reset isLoaded.
          // adding the branchScope will set
          // rootFolderDocWithMetadata back to undefined until the
          // folder hierarchy of the branch scope is loaded. after
          // rootFolderDocWithMetadata is loaded again
          // resolveUrlToDocPath is triggered again
          if (isBranchScopeASeparateDoc) {
            setIsLoaded(false);
            return;
          }

          // ... otherwise the branch scope is the document itself
          // in this case we can skip the check below that ensures that the doc is in the root folder
          const docPath = [
            ...DocPathUtils.forRoot(rootFolderDocWithMetadata.rootFolderUrl),
            {
              type: branchScopeType,
              name: "Loading...", // will be filled in once the doc is loaded
              url: branchScopeUrl,
            },
          ];

          setActiveBranchUrl(uiStateOm, docPath, urlParams.branchUrl ?? null);
          selectDocPath(docPath);
          return;
        } else {
          // if branch scope is in already in the folder we just need to make sure the right branch is checked out
          setActiveBranchUrl(
            uiStateOm,
            branchScopePathInRootFolder,
            urlParams.branchUrl ?? null
          );
        }
      }

      let docPath = getDocPathInRootFolder(
        urlParams,
        rootFolderDocWithMetadata,
        selectedDocPath
      );

      if (!docPath) {
        // special case: the url references a branch scope that doesn't contain the referenced docUrl
        // -> create a doc link that will lead to a 404 page
        if (branchScopePathInRootFolder) {
          const dataType = dataTypeById(urlParams.type);
          const doc = await repo.find(urlParams.url).doc();
          const title = (await dataType?.getTitle(doc, repo)) ?? "Unknown";

          docPath = branchScopePathInRootFolder.concat({
            type: urlParams.type,
            name: title,
            url: urlParams.url,
          });

          // ... otherwise add the doc to the root folder
        } else if (urlParams.type === "module-settings") {
          // XXX PVH TODO HACK: don't put module-settings into the root folder
          const docLink = {
            type: urlParams.type,
            // The name will be synced in here once the doc loads
            name: "Custom Packages",
            url: urlParams.url,
          };
          docPath = [
            ...DocPathUtils.forRoot(rootFolderDocWithMetadata.rootFolderUrl),
            docLink,
          ];
        } else {
          const docLink = {
            type: urlParams.type,
            // The name will be synced in here once the doc loads
            name: "Loading...",
            url: urlParams.url,
          };

          repo
            .find<FolderDoc>(rootFolderDocWithMetadata.rootFolderUrl)
            .change((doc) => {
              doc.docs.unshift(docLink);
            });

          docPath = [
            ...DocPathUtils.forRoot(rootFolderDocWithMetadata.rootFolderUrl),
            docLink,
          ];
        }
      }

      selectDocPath(docPath);
    }
  );

  /* handleUrlChange is called whenever the url changes
   *
   * This function parses the url params and ensures that resolveUrlToDocPath
   * is only called if the selected doc / branch in the url has actually changed
   */
  const handleUrlChange = useStaticCallback((url: URL) => {
    const urlParams = parseUrl(url);

    // redirect old urls to new scheme
    if (!urlParams) {
      const legacyUrlParams = parseLegacyUrl(url);
      if (legacyUrlParams) {
        window.location.hash = toUrl(legacyUrlParams);
      }
      return;
    }

    const newDocAlreadySelected =
      urlParams &&
      selectedDocLink?.url === urlParams.url &&
      selectedDocLink?.type === urlParams.type &&
      activeBranchUrl === urlParams.branchUrl &&
      // either active branchScopeUrl matches branchScopeUrl in urlParams
      // or branchUrl is defined so we don't need branchScopeUrl in urlParams
      (activeBranchScopeUrl === urlParams.branchScopeUrl ||
        (urlParams.branchScopeUrl === undefined &&
          activeBranchUrl !== undefined));

    if ((!urlParams && !selectedDocPath) || newDocAlreadySelected) {
      return;
    }

    if (!rootFolderDocWithMetadata) {
      return;
    }

    resolveUrlToDocPath(urlParams);
  });

  // Listen for url changes
  const url = useCurrentUrl();
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    handleUrlChange(url);
  }, [url, handleUrlChange, isLoaded]);

  return { selectedDocPath, selectDocPath };
};

// see: getDocPathInRootFolder for how the docLink is resolved
export const selectDocLink = (docLink: DocLink) => {
  location.hash = toUrl(docLink);
};

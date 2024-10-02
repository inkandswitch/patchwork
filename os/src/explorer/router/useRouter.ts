import { useStaticCallback } from "@/hooks/useStaticCallback";
import { DocLink, DocLinkWithFolderPath, FolderDoc } from "@/packages/folder";
import { FolderDocWithMetadata } from "@/packages/folder/hooks/useFolderDocWithChildren";
import { setActiveBranchUrl } from "@/versionControl/branches";
import { useBranchScopeAndActiveBranchInfo } from "@/versionControl/hooks";
import { BranchDoc } from "@/versionControl/schema";
import { fakeDocPath } from "@/versionControl/signals";
import {
  AutomergeUrl,
  DocumentId,
  isValidAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import queryString from "query-string";
import { useCallback, useEffect, useState } from "react";
import { useUIStateOm } from "../uiState";
import { useCurrentUrl } from "../url";
import { useDataTypes } from "@/hooks/useDataTypes";
import { dataTypeById } from "@/datatypes";
import { URLParams } from "./types";
import { getDocLinkInRootFolder } from "./getDocLinkInRootFolder";

// Construct a URL for a given document
const toUrl = (docLinkOrUrlParams: DocLink | URLParams): string => {
  const documentId = docLinkOrUrlParams.url.split(":")[1];

  // We put a human readable name in the url to make it easier to see what a link is
  let humanReadableName = "";
  if ("name" in docLinkOrUrlParams) {
    humanReadableName += getUrlSafeName(docLinkOrUrlParams.name);
  }
  if ("branchUrl" in docLinkOrUrlParams && docLinkOrUrlParams.branchName) {
    humanReadableName += `-(${getUrlSafeName(docLinkOrUrlParams.branchName)})`;
  }

  const baseUrl =
    humanReadableName.length > 0
      ? `${humanReadableName}--${documentId}`
      : documentId;

  const searchParams = new URLSearchParams();
  searchParams.append("type", docLinkOrUrlParams.type);
  if ("branchUrl" in docLinkOrUrlParams && docLinkOrUrlParams.branchUrl) {
    searchParams.append("branchUrl", docLinkOrUrlParams.branchUrl);
  }
  if (
    "branchScopeUrl" in docLinkOrUrlParams &&
    docLinkOrUrlParams.branchScopeUrl
  ) {
    searchParams.append("branchScopeUrl", docLinkOrUrlParams.branchScopeUrl);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

// Turn names into a readable url safe string
// - replaces any sequence of alpha numeric characters with a single "-"
// - limits length to 100 characters
export const getUrlSafeName = (value: string) => {
  let urlSafeName = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .slice(0, 100);

  if (urlSafeName.endsWith("-")) {
    urlSafeName = urlSafeName.slice(0, -1);
  }

  if (urlSafeName.startsWith("-")) {
    urlSafeName = urlSafeName.slice(1);
  }

  return urlSafeName;
};

// Parse older URL formats and map them into our newer format
const parseLegacyUrl = (url: URL): URLParams | null => {
  const possibleAutomergeUrl = url.pathname.slice(1);

  // First handle very old URLs that only had an Automerge URL:
  // /#automerge:12345

  if (isValidAutomergeUrl(possibleAutomergeUrl)) {
    return {
      url: possibleAutomergeUrl,
      type: "essay",
    };
  }

  // Now on to the main logic where we look for URLs of the form:
  // /#docUrl=automerge:12345&docType=essay&branchUrl
  const { docUrl, docType, branchUrl } =
    queryString.parse(possibleAutomergeUrl);

  if (typeof docUrl !== "string" || typeof docType !== "string") {
    return null;
  }

  if (typeof docUrl === "string" && !isValidAutomergeUrl(docUrl)) {
    alert(`Invalid Automerge URL in URL: ${docUrl}`);
    return null;
  }

  if (typeof branchUrl === "string" && !isValidAutomergeUrl(branchUrl)) {
    alert(`Invalid branch in URL: ${branchUrl}`);
    return null;
  }

  return {
    url: docUrl,
    type: docType,
    branchUrl: branchUrl as AutomergeUrl,
  };
};

export const parseUrl = (url: URL): URLParams | null => {
  const match = url.pathname.match(
    /^\/([a-z-A-Z0-9-]+(\([a-zA-Z0-9-]+\))?--)?(?<docId>\w+)$/
  );

  if (!match) {
    return null;
  }

  const { docId } = match.groups!;

  const docUrl = stringifyAutomergeUrl(docId as DocumentId);
  if (!isValidAutomergeUrl(docUrl)) {
    alert(`Invalid doc id in URL: ${docUrl}`);
    return null;
  }

  const datatypeId =
    url.searchParams.get("type") ?? url.searchParams.get("docType"); // use legacy docType as a fallback

  const branchUrl = url.searchParams.get("branchUrl");
  if (branchUrl && !isValidAutomergeUrl(branchUrl)) {
    alert(`Invalid branch in URL: ${branchUrl}`);
    return null;
  }

  const branchScopeUrl = url.searchParams.get("branchScopeUrl");
  if (!branchUrl && branchScopeUrl && !isValidAutomergeUrl(branchScopeUrl)) {
    alert(`Invalid branchScope in URL: ${branchScopeUrl}`);
    return null;
  }

  return {
    url: docUrl,
    type: datatypeId!, // TODO: JAH strict fix
    branchUrl: branchUrl ? (branchUrl as AutomergeUrl) : undefined,
    branchScopeUrl: branchScopeUrl
      ? (branchScopeUrl as AutomergeUrl)
      : undefined,
  };
};
/*
 * useRouter
 *
 * HOW IT WORKS
 *
 * The router hook syncs the selected document to the url so you can copy
 * and paste the url to share the currently selected document with someone else.
 * This seems simple enough but there are a couple of complications:
 *
 * The url only contains the url of the document not it's path in the folder
 * hierarchy. This is necessary so users can share documents that are deeply
 * nested in their folder hierarchy without exposing their whole folder structure.
 * But this means that the url of the document is not enough to pin point a single
 * document. The same document might be linked multiple times in the same folder structure.
 * There are two ways the selected document can change:
 *
 * 1. **url changes** In this case we lookup the document in the folder structure of the user
 *    and add it to the top if it doesn't exist
 * 2. **setSelectedDocLink is called** In this case we need to make sure that url is update to reflect the new document
 *
 * Keeping the url and the selectedDoc link state in sync is encapsulated in the `useSelectedDocLinkState`
 *
 * Another complication are branches. A document can exist in a branch scope which might be
 * the document itself or a folder above it. Which branch is checked out on a branch scope is stored
 * in the UIStateDoc of the user. This state can also change if a branch is checked out in a separate browser session.
 * More obscurely it's also possible that a document that wasn't in branch scope before gets a branch when folder that
 * it's contained in is turned into a branch scope. We need to make sure that the url always shows the
 * currently selected branch and if an url is pasted in that the correct branch is checked out.
 *
 * - the helper hook `useSelectedDocLinkState` syncs the current branchScope with the selected branch to the url and returns the activeBranchUrl and activeBranchScopeUrl
 * - in useRouter we compare activeBranchUrl und activeBranchScopeUrl if they match up the current url. If not we call `resolveUrlToDocLink`
 *
 * HOW TO TEST IT
 *
 * Currently we don't have any automatic test so for now if you change the routing code here is a list of things you should test
 *
 * - paste a link into a browser sessions that doesn't have the document
 *  - a document with no branch scope
 *  - a document where the branch scope is the document itself
 *    - checked out on main
 *    - checked out on a branch
 *  - a document where the branch scope is a folder in which it's contained
 *    - checked out on main
 *    - checked out on a branch
 *
 * - paste a link into a browser sessions that does have the document but a different doc is selected
 *  - a document with no branch scope
 *  - a document where the branch scope is the document itself
 *    - checked out on main
 *    - checked out on a branch
 *  - a document where the branch scope is a folder in which it's contained
 *    - checked out on main
 *    - checked out on a branch
 *
 * - paste a link into a browser sessions that does have the document but a the same doc is selected on a different branch
 *  - a document where the branch scope is the document itself
 *    - checked out on main
 *    - checked out on a branch
 *  - a document where the branch scope is a folder in which it's contained
 *    - checked out on main
 *    - checked out on a branch
 *
 * - create a new branch on a document
 *
 * - have the same document open in two separate browser sessions logged in to the same profile
 *  - change the branch, see that it's correctly reflected in the url of the other
 *
 */

export const useRouter = ({
  rootFolderDocWithMetadata,
}: {
  rootFolderDocWithMetadata: FolderDocWithMetadata | undefined;
}): {
  selectedDocLink: DocLinkWithFolderPath | undefined;
  // todo: should the folder path be optional?
  selectDocLink: (docLink: DocLinkWithFolderPath | undefined) => void;
} => {
  const repo = useRepo();
  const {
    selectedDocLink,
    selectDocLink,
    activeBranchUrl,
    activeBranchScopeUrl,
  } = useSelectedDocLinkState();

  const datatypes = useDataTypes();

  const uiStateOm = useUIStateOm();

  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (rootFolderDocWithMetadata && uiStateOm) {
      setIsLoaded(true);
    }
  }, [rootFolderDocWithMetadata, uiStateOm]);

  /* resolveUrlToDocLink is called whenever a new document selection was triggered by an url change.
   *
   * This function resolve the document url (with an optional branch / branchScope) to a docLink in the root folder.
   * If the user doesn't have the document / branchScopeDoc in their root folder we add the document / branchscope to the top of it.
   *
   * If the url contains a branch scope / branch url this function ensures that the right branch is checked out.
   * This changes the checked out branch for all other sessions of the logged in user.
   *
   * for details on how the resolution of urls in the root folder works see: getDocLinkInRootFolder
   */
  const resolveUrlToDocLink = useStaticCallback(
    async (urlParams: URLParams) => {
      if (!uiStateOm || !rootFolderDocWithMetadata) {
        return;
      }

      // clear selectedDocLink if url params are empty
      if (!urlParams) {
        selectDocLink(undefined);
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

      // make sure that the branch scope doc is in the root folder and that the right branch is checked out
      if (branchScopeUrl) {
        const isBranchScopeASeparateDoc = branchScopeUrl !== urlParams.url;

        // hack: we don't know the dataType of the branch scope but in practice we only have two cases
        // - branchScope is the document itself -> type of document
        // - branchscope is a folder that contains the document -> "folder"
        const branchScopeType = isBranchScopeASeparateDoc
          ? "folder"
          : urlParams.type;

        const branchScopeLinkInRootFolder = getDocLinkInRootFolder(
          { type: branchScopeType, url: branchScopeUrl },
          rootFolderDocWithMetadata,
          selectedDocLink
        );

        if (!branchScopeLinkInRootFolder) {
          const folderDataType = dataTypeById(datatypes, "folder")!;

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

          // if the branchScope is a separated doc we reset isLoaded
          // adding the branchScope will set rootFolderDocWithMetadata back to undefined until the folder hierarchy of the branch scope is loaded
          // after rootFolderDocWithMetadata is loaded again resolveUrlToDocLink is triggered again
          if (isBranchScopeASeparateDoc) {
            setIsLoaded(false);
            return;
          }

          // ... otherwise the branch scope is the document itself
          // in this case we can skip the check below that ensures that the doc is in the root folder
          const docLinkWithFolderPath = {
            type: branchScopeType,
            name: "Loading...", // will be filled in once the doc is loaded
            url: branchScopeUrl,
            folderPath: [rootFolderDocWithMetadata.rootFolderUrl],
          };

          setActiveBranchUrl(
            uiStateOm,
            fakeDocPath(docLinkWithFolderPath),
            urlParams.branchUrl ?? null
          );
          selectDocLink(docLinkWithFolderPath);
          return;
        } else {
          // if branch scope is in already in the folder we just need to make sure the right branch is checked out
          setActiveBranchUrl(
            uiStateOm,
            fakeDocPath(branchScopeLinkInRootFolder),
            urlParams.branchUrl ?? null
          );
        }
      }

      let docLinkWithFolderPath = getDocLinkInRootFolder(
        urlParams,
        rootFolderDocWithMetadata,
        selectedDocLink
      );

      if (!docLinkWithFolderPath) {
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

        docLinkWithFolderPath = {
          ...docLink,
          folderPath: [rootFolderDocWithMetadata.rootFolderUrl],
        };
      }

      selectDocLink(docLinkWithFolderPath);
    }
  );

  /* handleUrlChange is called whenever the url changes
   *
   * This function parses the url params and ensures that resolveUrlToDocLink
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

    if ((!urlParams && !selectedDocLink) || newDocAlreadySelected) {
      return;
    }

    if (!rootFolderDocWithMetadata) {
      return;
    }

    resolveUrlToDocLink(urlParams);
  });

  // Listen for url changes
  const url = useCurrentUrl();
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    handleUrlChange(url);
  }, [url, handleUrlChange, isLoaded]);

  return {
    selectedDocLink,
    selectDocLink,
  };
};

/**
 * useSelectedDocLinkState is a helper hook that does two things:
 *
 * 1. ensure selectedDocLink and hashUrl are always changed together
 * 2. keep the active branch synced to the url
 */
const useSelectedDocLinkState = (): {
  selectedDocLink: DocLinkWithFolderPath | undefined;
  selectDocLink: (docLink: DocLinkWithFolderPath | undefined) => void;
  activeBranchUrl?: AutomergeUrl;
  activeBranchScopeUrl?: AutomergeUrl;
} => {
  const [selectedDocLink, _setSelectedDocLink] =
    useState<DocLinkWithFolderPath>();

  // sync selected branch to url
  const branchScopeAndActiveBranchInfo = useBranchScopeAndActiveBranchInfo(
    selectedDocLink ? fakeDocPath(selectedDocLink) : undefined
  );

  const activeBranchScopeUrl = branchScopeAndActiveBranchInfo?.isRealBranchScope
    ? branchScopeAndActiveBranchInfo?.branchScopeOm.url
    : undefined;
  const activeBranchUrl = branchScopeAndActiveBranchInfo?.activeBranchOm?.url;
  const activeBranchName =
    branchScopeAndActiveBranchInfo?.activeBranchOm?.doc.name;

  useEffect(() => {
    if (
      selectedDocLink &&
      branchScopeAndActiveBranchInfo?.originalUrl === selectedDocLink.url
    ) {
      location.hash = toUrl({
        ...selectedDocLink,
        branchUrl: activeBranchUrl,
        branchName: activeBranchName,

        // only set branchScopeUrl if we are not on a branch, because if we have a branch we can get the branchScopeUrl through the branch
        // this avoids unnecessarily long urls
        branchScopeUrl: activeBranchUrl ? undefined : activeBranchScopeUrl,
      });
    }
  }, [
    activeBranchName,
    activeBranchUrl,
    branchScopeAndActiveBranchInfo?.originalUrl,
    selectedDocLink,
    activeBranchScopeUrl,
  ]);

  const selectDocLink = useCallback(
    async (docLink: DocLinkWithFolderPath | undefined) => {
      if (!docLink) {
        _setSelectedDocLink(undefined);
        location.hash = "";
        return;
      }

      _setSelectedDocLink(docLink);
      location.hash = toUrl(docLink);
    },
    []
  );

  return {
    selectedDocLink,
    selectDocLink,
    activeBranchUrl,
    activeBranchScopeUrl,
  };
};

// see: getDocLinkInRootFolder for how the docLink is resolved
export const selectDocLink = (docLink: DocLink) => {
  location.hash = toUrl(docLink);
};

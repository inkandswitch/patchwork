import { Account } from "@/explorer/account";
import { fetchUIStateOm } from "@/explorer/uiState";
import { Om } from "@/om";
import { DocLink, DocPath } from "@/packages/folder/datatype";
import { canBeUndef } from "@/utils";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { fetchDoc, fetchMap, fetchOm, fetchParallel } from "../async-signals";
import { DataType, dataTypeById } from "../datatypes";
import {
  BranchDoc,
  DocCloneMap,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "./schema";

export const fetchVersionControlMetadataOm = (
  doc: Automerge.Doc<HasVersionControlMetadata>,
  repo: Repo
): Om<VersionControlSidecarDoc> | undefined => {
  const versionControlMetadataUrl = canBeUndef(doc.versionControlMetadataUrl);
  return (
    versionControlMetadataUrl &&
    fetchOm<VersionControlSidecarDoc>(versionControlMetadataUrl, repo)
  );
};

// Given a doc path, you can ask for its "branch scope info". For convenience,
// if the path doesn't actually have a branch scope, we return values as though
// it were its own branch scope. (This represents what happens if you create a
// branch on a document without a branch scope – it becomes one.)

export type BranchScopeInfo = {
  branchScopeOm: Om<HasVersionControlMetadata>;
  branchScopeVersionControlMetadataOm: Om<VersionControlSidecarDoc> | undefined; // undefined if we don't have a branch scope, and we don't even have a sidecar doc
  branchScopePath: DocPath;
  branchOms: Om<BranchDoc>[];
  isRealBranchScope: boolean;
};

// Given a doc path representing current selected doc,
// resolve a branch scope and return relevant information about branches
export const fetchBranchScopeInfo = (
  docPath: DocPath,
  repo: Repo
): BranchScopeInfo => {
  // we need the metadata docs of all parent folders which requires an async op to load
  // to work with them in the useMemo hook below we fetch them with useDocuments
  const linkInfos = fetchMap(docPath, (link) => {
    const linkOm = fetchOm<HasVersionControlMetadata>(link.url, repo);
    const versionControlMetadataOm = fetchVersionControlMetadataOm(
      linkOm.doc,
      repo
    );
    return { linkOm, versionControlMetadataOm };
  });

  // go up the hierarchy and check if any of the parent folders are branch scopes
  for (let i = docPath.length - 1; i >= 0; i--) {
    const linkInfo = linkInfos[i];
    const versionControlMetadataOm = linkInfo.versionControlMetadataOm;
    if (
      versionControlMetadataOm &&
      versionControlMetadataOm.doc.isBranchScope
    ) {
      const branchOms = fetchMap(
        versionControlMetadataOm.doc.branches,
        (branchUrl) => fetchOm<BranchDoc>(branchUrl, repo)
      );
      return {
        branchScopeOm: linkInfo.linkOm,
        branchScopeVersionControlMetadataOm: versionControlMetadataOm,
        branchScopePath: docPath.slice(0, i + 1),
        isRealBranchScope: true,
        branchOms,
      } satisfies Partial<BranchScopeInfo>;
    }
  }

  // we didn't find a branch scope; let's pretend to be our own
  const lastLinkInfo = linkInfos[linkInfos.length - 1];
  return {
    branchScopeOm: lastLinkInfo.linkOm,
    branchScopeVersionControlMetadataOm: lastLinkInfo.versionControlMetadataOm,
    branchScopePath: docPath,
    isRealBranchScope: false,
    branchOms: [],
  };
};

export type ActiveBranchInfo = {
  /**
   * undefined means "main"
   */
  activeBranchOm: Om<BranchDoc> | undefined;

  // when there is no active branch an artificial cloneMap is generated
  // of all the files contained in the branch scope doc that map the doc urls to themselves.
  // The clone map is useful for checking if the currently checked out version contains a doc or not.
  cloneMap: DocCloneMap;
};

export const fetchActiveBranchInfo = (
  branchScopePath: DocPath,
  account: Account | undefined,
  repo: Repo,
  dataTypes: DataType[]
): ActiveBranchInfo => {
  const uiStateOm = fetchUIStateOm(repo, account);
  const activeBranchUrl = canBeUndef(
    // We handle the case of doc.openBranches being undefined here for backwards compatibility
    uiStateOm.doc.openBranches?.[DocPath.toString(branchScopePath)]
  );

  let activeBranchOm: Om<BranchDoc> | undefined;
  let cloneMap: DocCloneMap | undefined;

  if (activeBranchUrl) {
    activeBranchOm = fetchOm<BranchDoc>(activeBranchUrl, repo);
    cloneMap = activeBranchOm.doc.clones;
  } else {
    branchScopePath;
    const docLink = branchScopePath[branchScopePath.length - 1];
    const url = docLink.url;
    let type = docLink.type;

    // dirty hack: remove once we have real doc paths
    if (!type) {
      const doc = fetchDoc(url, repo);
      if ("docs" in doc && Array.isArray(doc.docs)) {
        type = "folder";
      }
    }

    cloneMap = { [url]: { url, baseHeads: [] } };
    const linkedDocs = fetchAllLinkedDocLinks(repo, url, type, dataTypes);

    for (const { url } of linkedDocs) {
      cloneMap[url] = { url, baseHeads: [] };
    }
  }

  return {
    activeBranchOm,
    cloneMap,
  };
};

export const fetchAllLinkedDocLinks = (
  repo: Repo,
  url: AutomergeUrl,
  dataTypeId: string,
  dataTypes: DataType[]
): DocLink[] => {
  const doc = fetchDoc(url, repo);

  const links = dataTypeById(dataTypes, dataTypeId)?.links;
  if (!links) {
    return [];
  }

  const directLinks = links(doc);

  return fetchParallel(
    directLinks.map((link) => () => {
      const childLinks = fetchAllLinkedDocLinks(
        repo,
        link.url,
        link.type,
        dataTypes
      );
      return [link, ...childLinks].flat();
    })
  ).flat();
};

export const fetchResolveUrlOnFixedBranch = (
  url: AutomergeUrl,
  activeBranchUrl: AutomergeUrl | undefined, // undefined means "main"
  repo: Repo
): {
  url: AutomergeUrl;
  baseHeads: Automerge.Heads | undefined;
} => {
  const activeBranchDoc =
    activeBranchUrl && fetchDoc<BranchDoc>(activeBranchUrl, repo);
  const cloneEntry = activeBranchDoc?.clones[url];
  return cloneEntry ?? { url, baseHeads: undefined };
};

export type BranchScopeAndActiveBranchInfo<
  T extends HasVersionControlMetadata = HasVersionControlMetadata
> = BranchScopeInfo &
  ActiveBranchInfo & {
    baseHeads: Automerge.Heads;
    originalUrl: AutomergeUrl;
    cloneOrMainOm: Om<T>;
  };

const EMPTY_HEADS: Automerge.Heads = [];

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const fetchBranchScopeAndActiveBranchInfo = <
  T extends HasVersionControlMetadata = HasVersionControlMetadata
>(
  docPath: DocPath,
  account: Account | undefined,
  repo: Repo,
  dataTypes: DataType[]
): BranchScopeAndActiveBranchInfo<T> => {
  const branchScopeInfo = fetchBranchScopeInfo(docPath, repo);
  const activeBranchInfo = fetchActiveBranchInfo(
    branchScopeInfo.branchScopePath,
    account,
    repo,
    dataTypes
  );

  const lastLink = docPath[docPath.length - 1];
  const { url, baseHeads } = fetchResolveUrlOnFixedBranch(
    lastLink.url,
    activeBranchInfo.activeBranchOm?.url,
    repo
  );
  const cloneOrMainOm = fetchOm<T>(url, repo);

  return {
    ...branchScopeInfo,
    ...activeBranchInfo,
    cloneOrMainOm,
    baseHeads: baseHeads ?? EMPTY_HEADS,
    originalUrl: lastLink.url,
  };
};

/**
 * Get the Om at the docPath, accounting for active branches stored in the UI state.
 */
export const fetchOmOnActiveBranch = <T>(
  docPath: DocPath,
  account: Account | undefined,
  repo: Repo,
  dataTypes: DataType[]
): Om<T> => {
  return fetchBranchScopeAndActiveBranchInfo(docPath, account, repo, dataTypes)
    .cloneOrMainOm as Om<T>;
};

/**
 * Get the Om at the docUrl, accounting for a specified branch.
 */
export const fetchOmOnFixedBranch = <T>(
  docUrl: AutomergeUrl,
  branchUrl: AutomergeUrl | undefined,
  repo: Repo
): Om<T> => {
  const docUrlOnBranch = branchUrl
    ? fetchResolveUrlOnFixedBranch(docUrl, branchUrl, repo)?.url
    : docUrl;

  if (!docUrlOnBranch) {
    throw new Error(`Document ${docUrl} does not exist on branch ${branchUrl}`);
  }

  return fetchOm<T>(docUrlOnBranch, repo);
};

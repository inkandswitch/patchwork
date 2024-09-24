import { Account } from "@/explorer/account";
import { docPathString, getUIStateOm } from "@/explorer/uiState";
import { Om } from "@/om";
import {
  DocLinkWithFolderPath,
  type DocPath,
} from "@/packages/folder/datatype";
import { canBeUndef } from "@/utils";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { getDoc, getOm, parallelMap } from "../async-signals";
import {
  BranchDoc,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "./schema";

export const getVersionControlMetadataOm = (
  doc: Automerge.Doc<HasVersionControlMetadata>,
  repo: Repo
): Om<VersionControlSidecarDoc> | undefined => {
  const versionControlMetadataUrl = canBeUndef(doc.versionControlMetadataUrl);
  return (
    versionControlMetadataUrl &&
    getOm<VersionControlSidecarDoc>(versionControlMetadataUrl, repo)
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
export const getBranchScopeInfo = (
  docPath: DocPath,
  repo: Repo
): BranchScopeInfo => {
  // we need the metadata docs of all parent folders which requires an async op to load
  // to work with them in the useMemo hook below we fetch them with useDocuments
  const linkInfos = parallelMap(docPath, (link) => {
    const linkOm = getOm<HasVersionControlMetadata>(link.url, repo);
    const versionControlMetadataOm = getVersionControlMetadataOm(
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
      const branchOms = parallelMap(
        versionControlMetadataOm.doc.branches,
        (branchUrl) => getOm<BranchDoc>(branchUrl, repo)
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
};

export const getActiveBranchInfo = (
  branchScopePath: DocPath,
  account: Account | undefined,
  repo: Repo
): ActiveBranchInfo => {
  const uiStateOm = getUIStateOm(repo, account);
  const activeBranchUrl = canBeUndef(
    // We handle the case of doc.openBranches being undefined here for backwards compatibility
    uiStateOm.doc.openBranches?.[docPathString(branchScopePath)]
  );

  return {
    activeBranchOm: activeBranchUrl && getOm<BranchDoc>(activeBranchUrl, repo),
  };
};

export const resolveUrlOnBranch = (
  url: AutomergeUrl,
  activeBranchUrl: AutomergeUrl | undefined, // undefined means "main"
  repo: Repo
): {
  url: AutomergeUrl;
  baseHeads: Automerge.Heads | undefined;
} => {
  const activeBranchDoc =
    activeBranchUrl && getDoc<BranchDoc>(activeBranchUrl, repo);
  const cloneEntry = activeBranchDoc?.clones[url];
  return cloneEntry ?? { url, baseHeads: undefined };
};

export type BranchScopeAndActiveBranchInfo = BranchScopeInfo &
  ActiveBranchInfo & {
    baseHeads: Automerge.Heads;
    originalUrl: AutomergeUrl;
    cloneOrMainOm: Om<HasVersionControlMetadata>;
  };

const EMPTY_HEADS: Automerge.Heads = [];

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const getBranchScopeAndActiveBranchInfo = (
  docPath: DocPath,
  account: Account | undefined,
  repo: Repo
): BranchScopeAndActiveBranchInfo => {
  const branchScopeInfo = getBranchScopeInfo(docPath, repo);
  const activeBranchInfo = getActiveBranchInfo(
    branchScopeInfo.branchScopePath,
    account,
    repo
  );

  const lastLink = docPath[docPath.length - 1];
  const { url, baseHeads } = resolveUrlOnBranch(
    lastLink.url,
    activeBranchInfo.activeBranchOm?.url,
    repo
  );
  const cloneOrMainOm = getOm<HasVersionControlMetadata>(url, repo);

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
export const getOmOnBranchFromPath = <T>(
  docPath: DocPath,
  account: Account | undefined,
  repo: Repo
): Om<T> => {
  return getBranchScopeAndActiveBranchInfo(docPath, account, repo)
    .cloneOrMainOm as Om<T>;
};

// This is an alternative to getOmOnBranchFromPath where you can directly provide the branchUrl
// to resolve the docUrl on
export const getOmOnBranch = <T>(
  docUrl: AutomergeUrl,
  branchUrl: AutomergeUrl | undefined,
  repo: Repo
): Om<T> => {
  const docUrlOnBranch = branchUrl
    ? resolveUrlOnBranch(docUrl, branchUrl, repo)?.url
    : docUrl;

  if (!docUrlOnBranch) {
    throw new Error(`Document ${docUrl} does not exist on branch ${branchUrl}`);
  }

  return getOm<T>(docUrlOnBranch, repo);
};

// TODO: provisional until we get rid of DocLinkWithFolderPath. also, this is in
// "signals" (bad name) cuz it needs to be somewhere that's safe to access from
// cli code
export const fakeDocPath = (
  docLinkWithFolderPath: DocLinkWithFolderPath
): DocPath => {
  return [
    ...docLinkWithFolderPath.folderPath.map((url) => ({
      name: undefined as any,
      type: undefined as any,
      url,
    })),
    docLinkWithFolderPath,
  ];
};

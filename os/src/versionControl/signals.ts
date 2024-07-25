import { docPathString, UIStateDoc } from "@/explorer/account";
import { Om } from "@/om";
import { DocLinkWithFolderPath, type DocPath } from "@/packages/folder/datatype";
import { getDoc, getOm, parallelMap } from "@/doc-reactive";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import {
  BranchDoc,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "./schema";
import { canBeUndef } from "@/utils";

// Given a doc path, you can ask for its "branch scope info". For convenience,
// if the path doesn't actually have a branch scope, we return values as though
// it were its own branch scope. (This represents what happens if you create a
// branch on a document without a branch scope – it becomes one.)

export type BranchScopeInfo = {
  branchScopeOm: Om<HasVersionControlMetadata>;
  branchScopeVersionControlMetadataOm: Om<VersionControlSidecarDoc> | undefined;  // undefined if we don't have a branch scope, and we don't even have a sidecar doc
  branchScopePath: DocPath;
  branchOms: Om<BranchDoc>[];
  isRealBranchScope: boolean;
};

// Given a doc path representing current selected doc,
// resolve a branch scope and return relevant information about branches
export const branchScopeInfo = (
  docPath: DocPath,
  repo: Repo
): BranchScopeInfo => {
  // we need the metadata docs of all parent folders which requires an async op to load
  // to work with them in the useMemo hook below we fetch them with useDocuments
  const linkInfos = parallelMap(docPath, (link) => {
    const linkOm = getOm<HasVersionControlMetadata>(link.url, repo);
    const versionControlMetadataUrl = linkOm.doc.versionControlMetadataUrl as AutomergeUrl | undefined;
    const versionControlMetadataOm = versionControlMetadataUrl && getOm<VersionControlSidecarDoc>(
      versionControlMetadataUrl,
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
      const branchOms = parallelMap(versionControlMetadataOm.doc.branches,
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
  setActiveBranchUrl: (branchDocUrl: AutomergeUrl | null) => void;
};

export const activeBranchInfo = (
  branchScopePath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>,
  repo: Repo
): ActiveBranchInfo => {
  const uiStateOm = getOm<UIStateDoc>(uiStateHandle.url, repo);

  const activeBranchUrl = canBeUndef(uiStateOm.doc.openBranches[docPathString(branchScopePath)]);

  const setActiveBranchUrl = (branchDocUrl: AutomergeUrl | null) => {
    uiStateOm.handle.change((uiStateDoc) => {
      // handle old uiState docs
      if (
        !uiStateDoc.openBranches ||
        Array.isArray(uiStateDoc.openBranches)
      ) {
        uiStateDoc.openBranches = {};
      }

      if (branchDocUrl) {
        uiStateDoc.openBranches[docPathString(branchScopePath)] =
          branchDocUrl;
      } else {
        delete uiStateDoc.openBranches[docPathString(branchScopePath)];
      }
    });
  };

  return {
    activeBranchOm: activeBranchUrl && getOm<BranchDoc>(activeBranchUrl, repo),
    setActiveBranchUrl,
  };
};

export const resolveUrlOnBranch = (
  url: AutomergeUrl,
  activeBranchUrl: AutomergeUrl | undefined,  // undefined means "main"
  repo: Repo
): {
  url: AutomergeUrl,
  baseHeads: Automerge.Heads | undefined,
} => {
  const activeBranchDoc = activeBranchUrl && getDoc<BranchDoc>(activeBranchUrl, repo);
  const cloneEntry = activeBranchDoc?.clones[url];
  return cloneEntry ?? { url, baseHeads: undefined };
}

export type BranchScopeAndActiveBranchInfo = BranchScopeInfo & ActiveBranchInfo & {
  baseHeads: Automerge.Heads | undefined;
  cloneOrMainOm: Om;
};

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const branchScopeAndActiveBranchInfo = (
  docPath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>,
  repo: Repo
): BranchScopeAndActiveBranchInfo => {
  const branchScopeInfo_ = branchScopeInfo(docPath, repo);
  const activeBranchInfo_ = activeBranchInfo(branchScopeInfo_.branchScopePath, uiStateHandle, repo);

  const lastLink = docPath[docPath.length - 1];
  const { url, baseHeads } = resolveUrlOnBranch(lastLink.url, activeBranchInfo_.activeBranchOm?.url, repo);
  const cloneOrMainOm = getOm(url, repo);

  return {
    ...branchScopeInfo_,
    ...activeBranchInfo_,
    cloneOrMainOm,
    baseHeads,
  };
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

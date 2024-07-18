import { docPathString, UIStateDoc } from "@/explorer/account";
import { DocPath } from "@/packages/folder/datatype";
import { OmSig } from "@/signals";
import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import _ from "lodash";
import { computed, Signal, } from 'signia';
import { BranchScopeAndActiveBranchInfo, BranchScopeInfo } from "./hooks";
import {
  BranchDoc,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "./schema";

// Given a doc path, you can ask for its "branch scope info". For convenience,
// if the path doesn't actually have a branch scope, we return values as though
// it were its own branch scope. (This represents what happens if you create a
// branch on a document without a branch scope – it becomes one.)

// Given a doc path representing current selected doc,
// resolve a branch scope and return relevant information about branches
export const branchScopeInfoSig = (docPath: DocPath, repo: Repo): Signal<BranchScopeInfo> => {
  // we need the metadata docs of all parent folders which requires an async op to load
  // to work with them in the useMemo hook below we fetch them with useDocuments
  const docPathOmSigs = docPath.map((link) => OmSig<HasVersionControlMetadata>(link.url, repo));
  const versionControlMetadataOmSigs = docPathOmSigs.map((docPathOmSig, i) =>
    computed('', () =>
      docPathOmSig.value?.doc.versionControlMetadataUrl &&
      OmSig<VersionControlSidecarDoc>(docPathOmSig.value.doc.versionControlMetadataUrl, repo).value
    )
  );

  return computed('', () => {
    // go up the hierarchy and check if any of the parent folders are branch scopes
    for (let i = docPath.length - 1; i >= 0; i--) {
      const versionControlMetadataOm = versionControlMetadataOmSigs[i].value;
      if (
        versionControlMetadataOm &&
        versionControlMetadataOm.doc.isBranchScope
      ) {
        const branchOms = versionControlMetadataOm.doc.branches.map((branchUrl) =>
          OmSig<BranchDoc>(branchUrl, repo).value);
        return {
          branchScopeOm: docPathOmSigs[i].value,
          branchScopeVersionControlMetadataOm: versionControlMetadataOm,
          branchScopePath: docPath.slice(0, i + 1),
          isRealBranchScope: true,
          branchOms,
        } satisfies Partial<BranchScopeInfo>;
      }
    }

    // we didn't find a branch scope; let's pretend to be our own
    return {
      branchScopeOm: _.last(docPathOmSigs).value,
      branchScopeVersionControlMetadataOm: _.last(versionControlMetadataOmSigs).value,
      branchScopePath: docPath,
      isRealBranchScope: false,
      branchOms: [],
    };
  });
};

export const activeBranchInfoSig = (
  branchScopePath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc> | undefined,
  repo: Repo
) => {
  const uiStateOmSig = OmSig<UIStateDoc>(uiStateHandle?.url, repo);

  return computed('', () => {
    const activeBranchUrl = uiStateOmSig.value?.doc.openBranches[docPathString(branchScopePath)] ?? null;

    const setActiveBranchUrl = (branchDocUrl: AutomergeUrl | null) => {
      uiStateOmSig.value.handle.change((uiStateDoc) => {
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
      activeBranchOm: OmSig<BranchDoc>(activeBranchUrl, repo).value,
      setActiveBranchUrl,
    };
  });
};

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const branchScopeAndActiveBranchInfoSig = (
  docPath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>,
  repo: Repo,
): Signal<BranchScopeAndActiveBranchInfo> => {
  const branchScopeInfoSig_ = branchScopeInfoSig(docPath, repo);

  const activeBranchInfoSig_ = computed('', () => {
    const { branchScopePath } = branchScopeInfoSig_.value;
    return activeBranchInfoSig(branchScopePath, uiStateHandle, repo).value;
  });

  const cloneOmSig = computed('', () => {
    const cloneUrl = activeBranchInfoSig_.value.activeBranchOm?.doc?.clones?.[_.last(docPath).url]?.url;
    return OmSig(cloneUrl, repo).value;
  });
  const mainOmSig = OmSig(_.last(docPath).url, repo);
  const cloneOrMainOmSig = computed('', () => cloneOmSig.value ?? mainOmSig.value);

  return computed('', () => ({
    ...branchScopeInfoSig_.value,
    ...activeBranchInfoSig_.value,
    cloneOrMainOm: cloneOrMainOmSig.value,
  }));
};

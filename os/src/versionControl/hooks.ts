import { UIStateDoc } from "@/explorer/account";
import { DocPath } from "@/packages/folder/datatype";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useMemo } from "react";
import { useValue } from "signia-react";
import { Om } from "../om";
import {
  BranchDoc,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "./schema";
import { activeBranchInfoSig, branchScopeAndActiveBranchInfoSig, branchScopeInfoSig } from "./signals";

// Given a doc path, you can ask for its "branch scope info". For convenience,
// if the path doesn't actually have a branch scope, we return values as though
// it were its own branch scope. (This represents what happens if you create a
// branch on a document without a branch scope – it becomes one.)

export type BranchScopeInfo = {
  branchScopeOm: Om<HasVersionControlMetadata>;
  branchScopeVersionControlMetadataOm: Om<VersionControlSidecarDoc>;
  branchScopePath: DocPath;
  branchOms: Om<BranchDoc>[];
  isRealBranchScope: boolean;
};

// Given a doc path representing current selected doc,
// resolve a branch scope and return relevant information about branches

export const useBranchScopeInfo = (docPath: DocPath): BranchScopeInfo => {
  const repo = useRepo();
  const branchScopeInfoSig_ = useMemo(() => branchScopeInfoSig(docPath, repo), [docPath, repo]);
  return useValue(branchScopeInfoSig_);
};

export type BranchScopeAndActiveBranchInfo = BranchScopeInfo & {
  activeBranchOm: Om<BranchDoc>;
  setActiveBranchUrl: (branchDocUrl: AutomergeUrl | null) => void;
  cloneOrMainOm: Om;
};

export const useActiveBranchInfo = (
  branchScopePath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>
) => {
  const repo = useRepo();
  const activeBranchInfoSig_ = useMemo(() =>
    activeBranchInfoSig(branchScopePath, uiStateHandle, repo),
    [branchScopePath, uiStateHandle, repo]
  );
  return useValue(activeBranchInfoSig_);
};

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const useBranchScopeAndActiveBranchInfo = (
  docPath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>
): BranchScopeAndActiveBranchInfo => {
  const repo = useRepo();
  const branchScopeAndActiveBranchInfoSig_ = useMemo(() =>
    branchScopeAndActiveBranchInfoSig(docPath, uiStateHandle, repo),
    [docPath, uiStateHandle, repo]
  );
  return useValue(branchScopeAndActiveBranchInfoSig_);
};

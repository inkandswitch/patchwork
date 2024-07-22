import { useUIStateHandle } from "@/explorer/account";
import { DocPath } from "@/packages/folder/datatype";
import { LoadingError, MissingError, UsesDocs, useUsesDocs } from "@/signals";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback } from "react";
import {
  activeBranchInfo,
  BranchScopeAndActiveBranchInfo,
  branchScopeAndActiveBranchInfo,
  BranchScopeInfo,
  branchScopeInfo,
} from "./signals";

// Given a doc path representing current selected doc,
// resolve a branch scope and return relevant information about branches

export const useBranchScopeInfo = (docPath: DocPath): UsesDocs<BranchScopeInfo> => {
  const repo = useRepo();
  return useUsesDocs(useCallback(() => {
    return branchScopeInfo(docPath, repo);
  }, [docPath, repo]));
};

export const useActiveBranchInfo = (
  branchScopePath: DocPath
) => {
  const repo = useRepo();
  const uiStateHandle = useUIStateHandle();
  return useUsesDocs(useCallback(() => {
    return activeBranchInfo(branchScopePath, uiStateHandle, repo);
  }, [branchScopePath, uiStateHandle, repo]));
};

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const useBranchScopeAndActiveBranchInfo = (
  docPath: DocPath | undefined
): BranchScopeAndActiveBranchInfo | LoadingError | MissingError => {
  const repo = useRepo();
  const uiStateHandle = useUIStateHandle();
  return useUsesDocs(useCallback(() => {
    return branchScopeAndActiveBranchInfo(docPath, uiStateHandle, repo);
  }, [docPath, uiStateHandle, repo]));
};

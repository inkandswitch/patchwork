import { getDR, ifLoaded, useDocReactive } from "@/doc-reactive";
import { useUIStateOm } from "@/explorer/account";
import { DocPath } from "@/packages/folder/datatype";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback } from "react";
import {
  BranchScopeAndActiveBranchInfo,
  BranchScopeInfo,
  getActiveBranchInfo,
  getBranchScopeAndActiveBranchInfo,
  getBranchScopeInfo,
} from "./signals";

// Given a doc path representing current selected doc,
// resolve a branch scope and return relevant information about branches

// For now, these hooks will follow the traditional "accept & return undefined"
// pattern. This is, god-willing, transitional.

export const useBranchScopeInfo = (
  docPath: DocPath | undefined
): BranchScopeInfo | undefined => {
  const repo = useRepo();
  return ifLoaded(useDocReactive(useCallback(() => {
    return docPath && getBranchScopeInfo(docPath, repo);
  }, [docPath, repo])));
};

export const useActiveBranchInfo = (
  branchScopePath: DocPath | undefined
) => {
  const repo = useRepo();
  const uiStateOm = useUIStateOm();
  return ifLoaded(useDocReactive(useCallback(() => (
    branchScopePath && getActiveBranchInfo(branchScopePath, getDR(uiStateOm), repo)
  ), [uiStateOm, branchScopePath, repo])));
};

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const useBranchScopeAndActiveBranchInfo = (
  docPath: DocPath | undefined
): BranchScopeAndActiveBranchInfo | undefined => {
  const repo = useRepo();
  const uiStateOm = useUIStateOm();
  return ifLoaded(useDocReactive(useCallback(() => (
    docPath && uiStateOm && getBranchScopeAndActiveBranchInfo(docPath, getDR(uiStateOm), repo)
  ), [docPath, uiStateOm, repo])));
};

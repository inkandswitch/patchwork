import { useAsyncComputed } from "@/async-signals";
import { useCurrentAccount } from "@/explorer/account";
import { DocPath } from "@/packages/folder/datatype";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useMemo, useRef } from "react";
import {
  BranchScopeAndActiveBranchInfo,
  fetchBranchScopeAndActiveBranchInfo,
} from "./signals";
import { useDataTypes } from "@/sdk";

/**
 * Given a doc path representing current selected doc, resolve a
 * branch scope and return relevant information about branches. This
 * is a `use` instead of a `fetch` because it needs to do some
 * de-duping to return referentially stable objects. (async-signals
 * can't do that, yet.)
 */
export const useBranchScopeAndActiveBranchInfo = (
  docPath: DocPath | undefined
): BranchScopeAndActiveBranchInfo | undefined => {
  const repo = useRepo();
  const account = useCurrentAccount();
  const dataTypes = useDataTypes();
  const branchScopeAndActiveBranchInfo = useAsyncComputed(
    useCallback(
      () =>
        docPath &&
        fetchBranchScopeAndActiveBranchInfo(docPath, account, repo, dataTypes),
      [docPath, account, repo, dataTypes]
    )
  ).ifPending(undefined).value;

  // This is really gnarly, but BranchScopeAndActiveBranchInfo has two
  // properties "branchOms" and "branchScopePath" that are recreated as new object
  // every time branchScopeAndActiveBranchInfo is recomputed
  //
  // This is a problem when we want to use branchOms and branchScopePath on their own
  // as dependencies in react hooks

  const activeBranchOm = branchScopeAndActiveBranchInfo?.activeBranchOm;
  const baseHeads = branchScopeAndActiveBranchInfo?.baseHeads;
  const branchOms = branchScopeAndActiveBranchInfo?.branchOms;
  const branchScopeOm = branchScopeAndActiveBranchInfo?.branchScopeOm;
  const branchScopePath = branchScopeAndActiveBranchInfo?.branchScopePath;
  const branchScopeVersionControlMetadataOm =
    branchScopeAndActiveBranchInfo?.branchScopeVersionControlMetadataOm;
  const isRealBranchScope = branchScopeAndActiveBranchInfo?.isRealBranchScope;
  const originalUrl = branchScopeAndActiveBranchInfo?.originalUrl;
  const cloneOrMainOm = branchScopeAndActiveBranchInfo?.cloneOrMainOm;
  const cloneMap = branchScopeAndActiveBranchInfo?.cloneMap;

  // memoize branchOms and branchScopePath

  const memoizedBranchOms = useDedupe(
    branchOms,
    (prevBranchOms, curBranchOms) =>
      prevBranchOms && curBranchOms
        ? areArraysShallowEqual(prevBranchOms, curBranchOms)
        : !curBranchOms
  );

  const memoizedBranchScopePath = useDedupe(
    branchScopePath,
    (branchScopePath, curBranchScopePath) =>
      branchScopePath && curBranchScopePath
        ? areArraysShallowEqual(branchScopePath, curBranchScopePath)
        : !curBranchScopePath
  );

  // reconstruct BranchScopeAndActiveBranchInfo with memoized version of branchOms and branchScopePath

  return useMemo(() => {
    if (
      memoizedBranchOms === undefined ||
      branchScopeOm === undefined ||
      memoizedBranchScopePath === undefined ||
      isRealBranchScope === undefined ||
      originalUrl === undefined ||
      cloneOrMainOm === undefined ||
      baseHeads === undefined ||
      cloneMap === undefined
    ) {
      return;
    }

    return {
      activeBranchOm,
      baseHeads,
      branchOms: memoizedBranchOms,
      branchScopeOm,
      branchScopePath: memoizedBranchScopePath,
      branchScopeVersionControlMetadataOm,
      isRealBranchScope,
      originalUrl,
      cloneOrMainOm,
      cloneMap,
    };
  }, [
    activeBranchOm,
    baseHeads,
    memoizedBranchOms,
    memoizedBranchScopePath,
    branchScopeOm,
    branchScopeVersionControlMetadataOm,
    isRealBranchScope,
    originalUrl,
    cloneOrMainOm,
    cloneMap,
  ]);
};

const areArraysShallowEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export function useDedupe<T>(t: T, eq: (x: T, y: T) => boolean): T {
  const lastT = useRef<T>();

  if (!lastT.current || (t !== lastT.current && !eq(t, lastT.current))) {
    lastT.current = t;
  }

  return lastT.current;
}

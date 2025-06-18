import { useAsyncComputed } from "../async-signals";
import { useCurrentAccount } from "../account";
import { DocPath } from "../router/DocLink";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useMemo, useRef } from "react";
import {
  BranchScopeAndActiveBranchInfo,
  fetchBranchScopeAndActiveBranchInfo,
} from "./signals";

export type MaybeBranchScopeAndActiveBranchInfo =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: BranchScopeAndActiveBranchInfo };

/**
 * Given a doc path representing current selected doc, resolve a
 * branch scope and return relevant information about branches. This
 * is a `use` instead of a `fetch` because it needs to do some
 * de-duping to return referentially stable objects. (async-signals
 * can't do that, yet.)
 */
export const useBranchScopeAndActiveBranchInfo = (
  docPath: DocPath | undefined
): MaybeBranchScopeAndActiveBranchInfo => {
  const repo = useRepo();
  const account = useCurrentAccount();
  const maybeBranchInfo = useAsyncComputed(
    useCallback(
      () =>
        docPath && {
          status: "ready" as const,
          data: fetchBranchScopeAndActiveBranchInfo(docPath, account, repo),
        },
      [docPath, account, repo]
    )
  )
    .ifPending(() => ({ status: "loading" }) as const)
    .ifRejected((error) => ({ status: "error", error }) as const).value;

  const branchScopeAndActiveBranchInfo =
    maybeBranchInfo?.status === "ready" ? maybeBranchInfo.data : undefined;

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
  return useMemo<MaybeBranchScopeAndActiveBranchInfo>(() => {
    if (maybeBranchInfo?.status === "loading") {
      return maybeBranchInfo;
    } else if (maybeBranchInfo?.status === "error") {
      return maybeBranchInfo;
    }

    // Check if all required values are defined before creating the ready state
    if (
      memoizedBranchOms === undefined ||
      branchScopeOm === undefined ||
      memoizedBranchScopePath === undefined ||
      isRealBranchScope === undefined ||
      originalUrl === undefined ||
      cloneOrMainOm === undefined ||
      baseHeads === undefined
    ) {
      return { status: "loading" };
    }

    return {
      status: "ready" as const,
      data: {
        activeBranchOm,
        baseHeads,
        branchOms: memoizedBranchOms,
        branchScopeOm,
        branchScopePath: memoizedBranchScopePath,
        branchScopeVersionControlMetadataOm,
        isRealBranchScope,
        originalUrl,
        cloneOrMainOm,
      },
    };
  }, [
    maybeBranchInfo,
    activeBranchOm,
    baseHeads,
    memoizedBranchOms,
    memoizedBranchScopePath,
    branchScopeOm,
    branchScopeVersionControlMetadataOm,
    isRealBranchScope,
    originalUrl,
    cloneOrMainOm,
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

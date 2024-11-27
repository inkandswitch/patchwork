import { DocPath } from "@/packages/folder/datatype";
import { useBranchScopeAndActiveBranchInfo } from "@patchwork/sdk/versionControl";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useCallback, useEffect, useState } from "react";
import { toUrl } from "./urls";

/**
 * useSelectedDocLinkState is a helper hook that does two things:
 *
 * 1. ensure selectedDocLink and hashUrl are always changed together
 * 2. keep the active branch synced to the url
 */
export const useSelectedDocPathState = (): {
  selectedDocPath: DocPath | undefined;
  selectDocPath: (docLink: DocPath | undefined) => void;
  activeBranchUrl?: AutomergeUrl;
  activeBranchScopeUrl?: AutomergeUrl;
} => {
  const [selectedDocPath, _setSelectedDocPath] = useState<DocPath>();
  const selectedDocLink = selectedDocPath && DocPath.toLink(selectedDocPath);

  // sync selected branch to url
  const branchScopeAndActiveBranchInfo =
    useBranchScopeAndActiveBranchInfo(selectedDocPath);

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
    selectedDocPath,
    activeBranchScopeUrl,
    selectedDocLink,
  ]);

  const selectDocPath = useCallback(async (docPath: DocPath | undefined) => {
    if (!docPath) {
      _setSelectedDocPath(undefined);
      location.hash = "";
      return;
    }

    _setSelectedDocPath(docPath);
    // TODO: (JAH) shouldn't this be handled through the useEffect above?
    // location.hash = toUrl(docPath);
  }, []);

  return {
    selectedDocPath,
    selectDocPath,
    activeBranchUrl,
    activeBranchScopeUrl,
  };
};

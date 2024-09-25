import { useAsyncComputed } from "@/async-signals";
import { useCurrentAccount } from "@/explorer/account";
import { Om } from "@/om";
import { DocPath, FolderDoc } from "@/packages/folder/datatype";
import {
  fetchBranchScopeAndActiveBranchInfo,
  fetchOmOnBranch,
} from "@/versionControl/signals";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback } from "react";
import { JacquardBuildMetadata } from "./datatype";

export type JacquardProjectInfo = {
  branchUrl: AutomergeUrl | undefined;
  projectFolderOm: Om<FolderDoc>;
  buildMetadataOm: Om<JacquardBuildMetadata>;
  buildMetadataMainDocUrl: AutomergeUrl;
};

export const useJacquardProjectInfoWithActiveBranch = (
  docPath: DocPath | undefined
): JacquardProjectInfo | undefined => {
  const repo = useRepo();
  const account = useCurrentAccount();
  return useAsyncComputed(
    useCallback(() => {
      if (!docPath || !account) {
        return;
      }
      const {
        activeBranchOm,
        branchScopeOm,
        branchScopeVersionControlMetadataOm,
      } = fetchBranchScopeAndActiveBranchInfo(docPath, account, repo);

      const maybeProjectFolderOm = branchScopeOm as Om<FolderDoc>;

      if (!maybeProjectFolderOm.doc.docs) {
        return;
      }

      const buildMetadataDocLink = maybeProjectFolderOm.doc.docs.find(
        (docLink) => docLink.type === "jacquard-build-metadata"
      );

      if (!buildMetadataDocLink) {
        return;
      }

      const buildMetadataOm = fetchOmOnBranch<JacquardBuildMetadata>(
        buildMetadataDocLink.url,
        activeBranchOm?.url,
        repo
      );

      return {
        branchUrl: activeBranchOm?.url,
        projectFolderOm: maybeProjectFolderOm,
        buildMetadataOm: buildMetadataOm,
        buildMetadataMainDocUrl: buildMetadataDocLink.url,
      };
    }, [docPath, account, repo])
  ).ifPending(undefined);
};

import { getDR, ifLoaded, useDocReactive } from "@/doc-reactive";
import { useUIStateOm } from "@/explorer/account";
import { Om } from "@/om";
import { DocPath, FolderDoc } from "@/packages/folder/datatype";
import {
  getBranchScopeAndActiveBranchInfo,
  getOmOnBranch,
} from "@/versionControl/signals";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback } from "react";
import { JacquardBuildMetadata } from "./datatype";

export type JacquardProjectInfo = {
  branchUrl: AutomergeUrl | undefined;
  projectFolderOm: Om<FolderDoc>;
  buildMetadataOm: Om<JacquardBuildMetadata>;
};

export const useJacquardProjectInfoWithActiveBranch = (
  docPath: DocPath | undefined
): JacquardProjectInfo | undefined => {
  const repo = useRepo();
  const uiStateOm = useUIStateOm();
  return ifLoaded(
    useDocReactive(
      useCallback(() => {
        if (!docPath || !uiStateOm) {
          return;
        }
        const {
          activeBranchOm,
          branchScopeOm,
          branchScopeVersionControlMetadataOm,
        } = getBranchScopeAndActiveBranchInfo(docPath, getDR(uiStateOm), repo);

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

        const buildMetadataOm = getOmOnBranch<JacquardBuildMetadata>(
          buildMetadataDocLink.url,
          activeBranchOm?.url,
          repo
        );

        return {
          branchUrl: activeBranchOm?.url,
          projectFolderOm: maybeProjectFolderOm,
          buildMetadataOm: buildMetadataOm,
        };
      }, [docPath, uiStateOm, repo])
    )
  );
};

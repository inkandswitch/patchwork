import { Account } from "@patchwork/sdk";
import { Om } from "@patchwork/sdk/om";
import { DocPath, FolderDoc } from "@/packages/folder/datatype";
import {
  fetchBranchScopeAndActiveBranchInfo,
  fetchOmOnFixedBranch,
} from "@patchwork/sdk/versionControl";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { JacquardBuildMetadata } from "./datatype";
import { DataType } from "@patchwork/sdk";

export type JacquardProjectInfo = {
  branchUrl: AutomergeUrl | undefined;
  projectFolderOm: Om<FolderDoc>;
  buildMetadataOm: Om<JacquardBuildMetadata>;
  buildMetadataMainDocUrl: AutomergeUrl;
};

/**
 * Returns `undefined` if `docPath` is not inside a Jacquard project.
 */
export const fetchJacquardProjectInfoWithActiveBranch = (
  docPath: DocPath,
  account: Account,
  repo: Repo
) => {
  const { activeBranchOm, branchScopeOm } = fetchBranchScopeAndActiveBranchInfo(
    docPath,
    account,
    repo
  );

  const maybeProjectFolderOm = branchScopeOm as Om<FolderDoc>;

  if (!maybeProjectFolderOm.doc.docs) {
    // The branch scope doesn't have a "docs" property and is
    // therefore not a folder doc.
    return;
  }

  const buildMetadataDocLink = maybeProjectFolderOm.doc.docs.find(
    (docLink) => docLink.type === "jacquard-build-metadata"
  );

  if (!buildMetadataDocLink) {
    // The branch scope doesn't have a build metadata doc and is
    // therefore not a Jacquard project.
    return;
  }

  const buildMetadataOm = fetchOmOnFixedBranch<JacquardBuildMetadata>(
    buildMetadataDocLink.url,
    activeBranchOm?.url,
    repo
  );

  return {
    branchUrl: activeBranchOm?.url,
    projectFolderOm: maybeProjectFolderOm,
    buildMetadataOm,
    buildMetadataMainDocUrl: buildMetadataDocLink.url,
  };
};

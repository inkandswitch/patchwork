import {
  BranchDoc,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "@/sdk";
import { Repo } from "@automerge/automerge-repo";
import { AutomergeUrl } from "@automerge/automerge-repo";

export const listBranches = async (
  repo: Repo,
  { projectFolderUrl }: { projectFolderUrl: AutomergeUrl }
) => {
  const projectFolderDoc = await repo
    .find<HasVersionControlMetadata<unknown, unknown>>(projectFolderUrl)
    .doc();
  const versionControlMetadataUrl = projectFolderDoc.versionControlMetadataUrl;

  if (!versionControlMetadataUrl) {
    console.log(
      "No version control metadata found on the folder. This is likely because the folder was created before Jacquard branches were implemented."
    );
    return;
  }

  const versionControlMetadataDoc = await repo
    .find<VersionControlSidecarDoc>(versionControlMetadataUrl)
    .doc();
  const branchUrls = versionControlMetadataDoc.branches;

  const branchDocs = await Promise.all(
    branchUrls.map((url) => repo.find<BranchDoc>(url).doc())
  );

  console.log("Branches:");
  branchDocs.forEach((branch) => {
    console.log(`- ${branch.name}`);
    if (branch.createdAt) {
      console.log(`  Created: ${new Date(branch.createdAt).toLocaleString()}`);
    }
    if (branch.createdBy) {
      console.log(`  Created by: ${branch.createdBy}`);
    }
  });
};

import { ContactDoc } from "@/explorer/account";
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
  console.log("loading branches for", projectFolderUrl);
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

  if (!versionControlMetadataDoc.isBranchScope) {
    console.log("No branches found. (Folder is not a branch scope)");
    return;
  }
  const branchUrls = versionControlMetadataDoc.branches;

  const branches = await Promise.all(
    branchUrls.map(async (url) => ({
      url,
      branchDoc: await repo.find<BranchDoc>(url).doc(),
    }))
  );
  if (branches.length === 0) {
    console.log("No branches found.");
    return;
  }

  branches.forEach(async ({ branchDoc, url }) => {
    console.log(`- ${branchDoc.name}`);
    console.log(`  URL: ${url}`);
    if (branchDoc.createdAt) {
      console.log(
        `  Created: ${new Date(branchDoc.createdAt).toLocaleString()}`
      );
    }
    if (branchDoc.createdBy) {
      const contactDoc = await repo.find<ContactDoc>(branchDoc.createdBy).doc();
      if (contactDoc.type === "registered") {
        console.log(`  Created by: ${contactDoc.name}`);
      } else {
        console.log(`  Created by: anonymous user`);
      }
    }
  });
};

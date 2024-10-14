import { ContactDoc } from "@/explorer/account";
import {
  BranchDoc,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "@/sdk";
import { Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { getJacquardConfig } from "./util";

export const listBranches = async (repo: Repo, args: CommandLineArgs) => {
  const { projectFolderUrl } = args;

  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }
  console.log("loading branches for project folder", projectFolderUrl);
  const projectFolderDoc = await repo
    .find<HasVersionControlMetadata<unknown, unknown>>(projectFolderUrl)
    .doc();
  if (!projectFolderDoc) {
    throw new Error(`Project folder doc missing: ${projectFolderUrl}`);
  }
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
  if (!versionControlMetadataDoc) {
    throw new Error(
      `Version control metadata doc missing: ${versionControlMetadataUrl}`
    );
  }

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

  const config = getJacquardConfig();

  if (!config?.activeBranchUrl) {
    console.log(`- \x1b[1mmain\x1b[0m`);
  } else {
    console.log(`- main`);
  }
  branches.forEach(async ({ branchDoc, url }) => {
    const name = branchDoc?.name ?? "<branch doc missing>";
    if (config?.activeBranchUrl === url) {
      console.log(`- \x1b[1m${name}\x1b[0m`);
    } else {
      console.log(`- ${name}`);
    }
    console.log(`  URL: ${url}`);
    if (!branchDoc) {
      return;
    }
    if (branchDoc.createdAt) {
      console.log(
        `  Created: ${new Date(branchDoc.createdAt).toLocaleString()}`
      );
    }
    if (branchDoc.createdBy) {
      const contactDoc = await repo.find<ContactDoc>(branchDoc.createdBy).doc();
      if (!contactDoc) {
        console.log(`  Created by: <contact doc missing>`);
      } else if (contactDoc.type === "registered") {
        console.log(`  Created by: ${contactDoc.name}`);
      } else {
        console.log(`  Created by: anonymous user`);
      }
    }
  });
};

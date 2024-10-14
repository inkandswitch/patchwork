import { Repo } from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { pull } from "./pull";

// Activate a branch and represent its files on disk.
// TODO: warn people if they have pending un-pushed changes on disk?
export async function activateBranch(repo: Repo, args: CommandLineArgs) {
  const { dir, branchUrl } = args;

  // Read the existing jacquard.json file
  const jacquardConfigPath = path.join(dir, "jacquard.json");
  let jacquardConfig: any = {};

  if (fs.existsSync(jacquardConfigPath)) {
    const configContent = fs.readFileSync(jacquardConfigPath, "utf-8");
    jacquardConfig = JSON.parse(configContent);
  }

  // Update the activeBranchUrl in the config
  if (branchUrl === "main") {
    delete jacquardConfig.activeBranchUrl;
  } else {
    jacquardConfig.activeBranchUrl = branchUrl;
  }

  // Write the updated config back to jacquard.json
  fs.writeFileSync(jacquardConfigPath, JSON.stringify(jacquardConfig, null, 2));

  await pull(repo, args);
}

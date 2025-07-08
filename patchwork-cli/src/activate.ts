import { Repo } from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { pull } from "./pull";

// Activate a branch and represent its files on disk.
// TODO: warn people if they have pending un-pushed changes on disk?
export async function activateBranch(repo: Repo, args: CommandLineArgs) {
  const { dir, branchUrl } = args;

  // Read the existing patchwork.json file
  const patchworkConfigPath = path.join(dir, "patchwork.json");
  let patchworkConfig: any = {};

  if (fs.existsSync(patchworkConfigPath)) {
    const configContent = fs.readFileSync(patchworkConfigPath, "utf-8");
    patchworkConfig = JSON.parse(configContent);
  }

  // Update the activeBranchUrl in the config
  if (branchUrl === "main") {
    delete patchworkConfig.activeBranchUrl;
  } else {
    patchworkConfig.activeBranchUrl = branchUrl;
  }

  // Write the updated config back to patchwork.json
  fs.writeFileSync(
    patchworkConfigPath,
    JSON.stringify(patchworkConfig, null, 2)
  );

  await pull(repo, args);
}

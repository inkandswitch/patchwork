import { Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { setConfig } from "./util";

export async function logout(repo: Repo, args: CommandLineArgs) {
  // Clear both URLs from config
  setConfig({
    accountUrl: undefined,
    parentFolderUrl: undefined,
  });

  console.log("Successfully logged out!");
}

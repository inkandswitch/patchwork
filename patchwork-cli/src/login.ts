import {
  AutomergeUrl,
  Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { setStoredAccountUrl, setStoredParentFolderUrl } from "./util";
import { accountTokenToAutomergeUrl, AccountDoc } from "@patchwork/sdk";

export async function login(repo: Repo, args: CommandLineArgs) {
  const { accountUrl } = args;

  if (!accountUrl) {
    console.error(
      "No account URL or token provided. Usage: patchwork login --accountUrl <account-url-or-token>"
    );
    process.exit(1);
  }

  // Try to parse as account token first
  let automergeUrl: AutomergeUrl | undefined;
  if (accountUrl.startsWith("account:")) {
    automergeUrl = accountTokenToAutomergeUrl(accountUrl);
    if (!automergeUrl) {
      console.error("Invalid account token format");
      process.exit(1);
    }
  } else {
    // Try as direct automerge URL
    if (!isValidAutomergeUrl(accountUrl)) {
      console.error(
        "Invalid URL format - must be an Automerge URL or account token"
      );
      process.exit(1);
    }
    automergeUrl = accountUrl;
  }

  // Verify the account exists by trying to load it
  const accountHandle = await repo.find<AccountDoc>(automergeUrl);
  const accountDoc = accountHandle.doc();

  if (!accountDoc) {
    console.error(
      "Account not found. Please check the URL/token and try again."
    );
    process.exit(1);
  }

  // Store the account URL and root folder URL
  setStoredAccountUrl(automergeUrl);
  setStoredParentFolderUrl(accountDoc.rootFolderUrl);
  console.log("Successfully logged in!");
}

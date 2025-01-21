import {
  AutomergeUrl,
  Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { getStoredAccountUrl, waitForSync } from "./util";
import { AccountDoc, ModuleSettingsDoc } from "@patchwork/sdk";

export async function install(repo: Repo, args: CommandLineArgs) {
  const { moduleUrl, syncServerStorageId } = args;

  if (!moduleUrl) {
    console.error(
      "No module URL provided. Usage: jacquard install --moduleUrl <module-url>"
    );
    process.exit(1);
  }

  if (!isValidAutomergeUrl(moduleUrl)) {
    console.error("Invalid Automerge URL format");
    process.exit(1);
  }

  // Check if user is logged in
  const accountUrl = getStoredAccountUrl();
  if (!accountUrl) {
    console.error(
      "Not logged in. Please run 'jacquard login --accountUrl <account-url>' first"
    );
    process.exit(1);
  }

  // Load account document
  const accountHandle = repo.find<AccountDoc>(accountUrl);
  const accountDoc = await accountHandle.doc();

  if (!accountDoc) {
    console.error("Account not found. Please log in again.");
    process.exit(1);
  }

  // Load module settings document
  const moduleSettingsHandle = repo.find<ModuleSettingsDoc>(
    accountDoc.moduleSettingsUrl
  );
  const moduleSettingsDoc = await moduleSettingsHandle.doc();

  if (!moduleSettingsDoc) {
    console.error("Module settings document not found");
    process.exit(1);
  }

  // Add module URL to settings
  moduleSettingsHandle.change((doc) => {
    if (!doc.modules.includes(moduleUrl)) {
      doc.modules.push(moduleUrl);
    }
  });

  await waitForSync([moduleSettingsHandle], syncServerStorageId);

  console.log("Successfully installed module!");
}

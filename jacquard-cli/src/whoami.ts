import { Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { getStoredAccountUrl } from "./util";
import { AccountDoc, ContactDoc } from "@patchwork/sdk";

export async function whoami(repo: Repo, args: CommandLineArgs) {
  const accountUrl = getStoredAccountUrl();

  if (!accountUrl) {
    console.log("Not logged in. Use 'jacquard login' to log in.");
    process.exit(1);
  }

  const accountHandle = repo.find<AccountDoc>(accountUrl);
  const accountDoc = await accountHandle.doc();

  if (!accountDoc) {
    console.error("Account not found. Please log in again.");
    process.exit(1);
  }

  const contactHandle = repo.find<ContactDoc>(accountDoc.contactUrl);
  const contactDoc = await contactHandle.doc();

  if (!contactDoc) {
    console.error("Contact information not found. Please log in again.");
    process.exit(1);
  }

  if (contactDoc.type === "anonymous") {
    console.log("Anonymous user");
  } else {
    console.log(`Logged in as: ${contactDoc.name}`);
  }
}

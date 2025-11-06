import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import {
  HasPatchworkMetadata,
  FolderDoc,
  ModuleSettingsDoc,
} from "@patchwork/filesystem";
import { generateColorFromString } from "./ui/userColors";
import {
  ContactDoc,
  RegisteredContactDoc,
  TinyPatchworkLayoutDoc,
} from "./types";

const ACCOUNT_URL_STORAGE_KEY = "tinyPatchworkAccountUrl";

/**
 * Sign up: Convert an anonymous contact to a registered one with a name and optional avatar
 */
export async function signUp(
  repo: Repo,
  name: string,
  avatarUrl?: AutomergeUrl
): Promise<void> {
  const accountDocHandle = window.accountDocHandle;
  if (!accountDocHandle) {
    throw new Error("No account doc handle found");
  }

  const accountDoc = accountDocHandle.doc();
  if (!accountDoc?.contactUrl) {
    throw new Error("No contact URL in account doc");
  }

  const contactHandle = await repo.find<ContactDoc>(accountDoc.contactUrl);

  contactHandle.change((contact: ContactDoc) => {
    contact.type = "registered";
    (contact as RegisteredContactDoc).name = name;
    if (avatarUrl) {
      (contact as RegisteredContactDoc).avatarUrl = avatarUrl;
    }
  });
}

/**
 * Log in: Switch to a different account by changing the stored account URL
 */
export async function logIn(accountUrl: AutomergeUrl): Promise<void> {
  localStorage.setItem(ACCOUNT_URL_STORAGE_KEY, accountUrl);
  // Reload the page to switch accounts
  window.location.reload();
}

/**
 * Log out: Create a new anonymous account
 */
export async function logOut(repo: Repo): Promise<void> {
  // Create a new anonymous contact with a random color
  const contactHandle = await repo.create2<ContactDoc & HasPatchworkMetadata>();
  const randomColor = generateColorFromString(contactHandle.url);

  contactHandle.change((doc) => {
    doc.type = "anonymous";
    (doc as any)["@patchwork"] = {
      type: "patchwork:contact",
    };
    (doc as any).color = randomColor;
  });

  // Create a new root folder
  const rootFolderHandle = await repo.create2<FolderDoc & HasPatchworkMetadata>(
    {
      ["@patchwork"]: { type: "folder" },
      title: "root",
      docs: [],
    }
  );

  // Create new module settings
  const moduleSettingsHandle = await repo.create2<
    ModuleSettingsDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "patchwork:module-settings" },
    modules: [],
  });

  // Create the new account doc
  const newAccountHandle = await repo.create2<
    TinyPatchworkLayoutDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "account" },
    contactUrl: contactHandle.url,
    rootFolderUrl: rootFolderHandle.url,
    moduleSettingsUrl: moduleSettingsHandle.url,
    frameToolId: "patchwork-frame",
    accountSidebarToolId: "chee/sideboard",
    contextSidebarToolId: "context-sidebar",
    contextToolIds: ["comments-view", "history-view", "context-view"],
    documentToolbarToolIds: [
      "document-title",
      "back-link-button",
      "spacer",
      "highlight-changes-checkbox",
    ],
  });

  // Update localStorage and reload
  localStorage.setItem(ACCOUNT_URL_STORAGE_KEY, newAccountHandle.url);
  window.location.reload();
}

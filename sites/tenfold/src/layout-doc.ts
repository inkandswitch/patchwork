import {
  FolderDoc,
  ModuleSettingsDoc,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { AutomergeUrl, isValidAutomergeUrl, Repo } from "@automerge/vanillajs";
import type { AutomergeRepoKeyhive } from "virtual:patchwork/setup";

export type TinyPatchworkLayoutDoc = {
  contactUrl: AutomergeUrl;
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;

  frameToolId: string;
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  contextToolIds: string[];
  documentToolbarToolIds: string[];
};

export interface AnonymousContactDoc {
  type: "anonymous";
  color?: string; // HSL color string for user presence indicators
}

export interface RegisteredContactDoc {
  type: "registered";
  name: string;
  avatarUrl?: AutomergeUrl;
  color?: string; // HSL color string for user presence indicators
}

export type ContactDoc = AnonymousContactDoc | RegisteredContactDoc;

function isValidLayoutDoc(
  doc: any
): doc is TinyPatchworkLayoutDoc & HasPatchworkMetadata {
  return (
    doc &&
    typeof doc.frameToolId === "string" &&
    typeof doc.accountSidebarToolId === "string" &&
    typeof doc.contextSidebarToolId === "string" &&
    Array.isArray(doc.contextToolIds) &&
    Array.isArray(doc.documentToolbarToolIds) &&
    typeof doc.rootFolderUrl === "string" &&
    typeof doc.contactUrl === "string" &&
    isValidAutomergeUrl(doc.contactUrl) &&
    typeof doc.moduleSettingsUrl === "string"
  );
}

async function createLayoutDoc(
  repo: Repo,
  options?: {
    contactUrl?: AutomergeUrl;
    rootFolderUrl?: AutomergeUrl;
    moduleSettingsUrl?: AutomergeUrl;
  }
) {
  let contactUrl = options?.contactUrl;
  let rootFolderUrl = options?.rootFolderUrl;
  let moduleSettingsUrl = options?.moduleSettingsUrl;

  if (!contactUrl) {
    const contactHandle = await repo.create2<ContactDoc & HasPatchworkMetadata>(
      {
        ["@patchwork"]: { type: "patchwork:contact" },
        type: "anonymous",
      }
    );
    contactUrl = contactHandle.url;
  }

  if (!rootFolderUrl) {
    const rootFolderHandle = await repo.create2<
      FolderDoc & HasPatchworkMetadata
    >({
      ["@patchwork"]: { type: "folder" },
      title: "root",
      docs: [],
    });
    rootFolderUrl = rootFolderHandle.url;
  }

  if (!moduleSettingsUrl) {
    const moduleSettingsHandle = await repo.create2<
      ModuleSettingsDoc & HasPatchworkMetadata
    >({
      ["@patchwork"]: { type: "patchwork:module-settings" },
      modules: [],
    });
    moduleSettingsUrl = moduleSettingsHandle.url;
  }

  const account = await repo.create2<
    TinyPatchworkLayoutDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "account" },
    contactUrl,
    rootFolderUrl,
    moduleSettingsUrl,
    frameToolId: "patchwork-frame",
    accountSidebarToolId: "chee/sideboard",
    contextSidebarToolId: "context-sidebar",
    contextToolIds: ["comments-view", "history-view", "context-view"],
    documentToolbarToolIds: [
      "document-title",
      "back-link-button",
      "spacer",
      "highlight-changes-checkbox",
      "add-doc-to-sidebar-button",
    ],
  });

  return account;
}

export async function getOrCreateLayoutDocHandle(
  repo: Repo,
  hive?: AutomergeRepoKeyhive
) {
  const accountDocKey = `tinyPatchwork${hive ? "Keyhive" : ""}AccountUrl`;
  const previousKey = `tinyPatchwork${hive ? "Keyhive" : ""}PreviousAccountUrls`;
  const existing = localStorage.getItem(accountDocKey) as
    | AutomergeUrl
    | undefined;

  if (existing) {
    let accountDoc: (TinyPatchworkLayoutDoc & HasPatchworkMetadata) | undefined;
    try {
      const findPromise = repo.find<
        TinyPatchworkLayoutDoc & HasPatchworkMetadata
      >(existing);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout finding account doc")), 5000)
      );
      const accountDocHandle = await Promise.race([
        findPromise,
        timeoutPromise,
      ]);

      accountDoc = accountDocHandle.doc();

      if (isValidLayoutDoc(accountDoc)) {
        return accountDocHandle;
      }
    } catch (e) {
      console.warn(
        "Failed to find existing account document, creating new one",
        e
      );
    }

    // Store the previous account URL
    let previousUrls: AutomergeUrl[] = JSON.parse(
      localStorage.getItem(previousKey) || "[]"
    );
    if (!previousUrls.includes(existing)) {
      previousUrls.push(existing);
      if (previousUrls.length > 10) previousUrls = previousUrls.slice(-10);
      localStorage.setItem(previousKey, JSON.stringify(previousUrls));
    }

    // Invalid account doc or timeout, create a new one but preserve existing folder and settings
    console.warn(
      `account document unavailable. moving its id to ${previousKey} and creating a new one. existing account doc url: ${existing}`
    );
    const account = await createLayoutDoc(repo, {
      contactUrl: accountDoc?.contactUrl,
      rootFolderUrl: accountDoc?.rootFolderUrl,
      moduleSettingsUrl: accountDoc?.moduleSettingsUrl,
    });
    localStorage.setItem(accountDocKey, account.url);
    return account;
  }

  const account = await createLayoutDoc(repo);
  localStorage.setItem(accountDocKey, account.url);
  return account;
}

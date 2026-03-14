import {
  FolderDoc,
  ModuleSettingsDoc,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { AutomergeUrl, Repo } from "@automerge/vanillajs";
import type { AutomergeRepoKeyhive } from "virtual:patchwork/setup";

export type TinyPatchworkLayoutDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;

  frameToolId: string;
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  contextToolIds: string[];
  documentToolbarToolIds: string[];
};

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
    typeof doc.moduleSettingsUrl === "string"
  );
}

async function createLayoutDoc(
  repo: Repo,
  options?: {
    rootFolderUrl?: AutomergeUrl;
    moduleSettingsUrl?: AutomergeUrl;
  }
) {
  let rootFolderUrl = options?.rootFolderUrl;
  let moduleSettingsUrl = options?.moduleSettingsUrl;

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
      disabled: [],
    });
    moduleSettingsUrl = moduleSettingsHandle.url;
  }

  const account = await repo.create2<
    TinyPatchworkLayoutDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "account" },
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
    ],
  });

  return account;
}

export async function getOrCreateLayoutDocHandle(
  repo: Repo,
  hive?: AutomergeRepoKeyhive
) {
  const accountDocKey = `tinyPatchwork${hive ? "Keyhive" : ""}AccountUrl`;
  const existing = localStorage.getItem(accountDocKey) as
    | AutomergeUrl
    | undefined;

  if (existing) {
    const accountDocHandle = await repo.find<
      TinyPatchworkLayoutDoc & HasPatchworkMetadata
    >(existing);

    const accountDoc = accountDocHandle.doc();

    if (isValidLayoutDoc(accountDoc)) {
      return accountDocHandle;
    }

    // Invalid account doc, create a new one but preserve existing folder and settings
    console.warn(
      "Old account document detected, creating new account doc with preserved data"
    );
    const account = await createLayoutDoc(repo, {
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

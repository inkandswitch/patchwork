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
    const rootFolderHandle = repo.create<
      FolderDoc & HasPatchworkMetadata
    >();
    rootFolderHandle.change((d: any) => {
      d["@patchwork"] = { type: "folder" };
      d.title = "root";
      d.docs = [];
    });
    rootFolderUrl = rootFolderHandle.url;
  }

  if (!moduleSettingsUrl) {
    const moduleSettingsHandle = repo.create<
      ModuleSettingsDoc & HasPatchworkMetadata
    >();
    moduleSettingsHandle.change((d: any) => {
      d["@patchwork"] = { type: "patchwork:module-settings" };
      d.modules = [];
    });
    moduleSettingsUrl = moduleSettingsHandle.url;
  }

  const account = repo.create<
    TinyPatchworkLayoutDoc & HasPatchworkMetadata
  >();
  account.change((d: any) => {
    d["@patchwork"] = { type: "account" };
    d.rootFolderUrl = rootFolderUrl;
    d.moduleSettingsUrl = moduleSettingsUrl;
    d.frameToolId = "patchwork-frame";
    d.accountSidebarToolId = "chee/sideboard";
    d.contextSidebarToolId = "context-sidebar";
    d.contextToolIds = ["comments-view", "history-view", "context-view"];
    d.documentToolbarToolIds = [
      "document-title",
      "back-link-button",
      "spacer",
      "highlight-changes-checkbox",
    ];
  });

  return account;
}

export async function getOrCreateLayoutDocHandle(
  repo: Repo,
  hive?: AutomergeRepoKeyhive
) {
  const accountDocKey = `gaios${hive ? "Keyhive" : ""}AccountUrl`;
  const existing = localStorage.getItem(accountDocKey) as
    | AutomergeUrl
    | undefined;

  // Check previous account URLs in case of identity change
  const previousUrls = JSON.parse(localStorage.getItem("gaiosPreviousAccountUrls") || "[]") as string[];

  if (existing) {
    const progress = repo.findWithProgress<TinyPatchworkLayoutDoc & HasPatchworkMetadata>(existing);
    const current = progress.peek();
    const accountDocHandle = await new Promise<any>((resolve) => {
      const timer = setTimeout(() => {
        unsubscribe();
        resolve(current.state === "ready" ? current.handle : null);
      }, 10000);
      if (current.state === "ready") {
        clearTimeout(timer);
        resolve(current.handle);
        return;
      }
      const unsubscribe = progress.subscribe((state) => {
        if (state.state === "ready") {
          clearTimeout(timer);
          unsubscribe();
          resolve(state.handle);
        }
      });
    });

    if (accountDocHandle) {
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
      if (!previousUrls.includes(existing)) {
        previousUrls.push(existing);
        localStorage.setItem("gaiosPreviousAccountUrls", JSON.stringify(previousUrls));
      }
      localStorage.setItem(accountDocKey, account.url);
      return account;
    }

    // Timed out finding account doc
    console.warn("Timed out finding account doc, creating new one");
  }

  const account = await createLayoutDoc(repo);
  if (existing && !previousUrls.includes(existing)) {
    previousUrls.push(existing);
    localStorage.setItem("gaiosPreviousAccountUrls", JSON.stringify(previousUrls));
  }
  localStorage.setItem(accountDocKey, account.url);
  return account;
}

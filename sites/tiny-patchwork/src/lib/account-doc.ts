import {
  FolderDoc,
  ModuleSettingsDoc,
  type HasPatchworkMetadata,
} from "@patchwork/filesystem";

import { AutomergeUrl, Repo } from "@automerge/vanillajs";
import type { AutomergeRepoKeyhive } from "virtual:patchwork/setup";
import { TabbedViewDoc } from "../tools/context-sidebar/datatype";

export type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;

  frameToolId: string;
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  contextToolIds: string[];
  documentToolbarToolIds: string[];
};

export async function getOrCreateAccountDocHandle(
  repo: Repo,
  hive?: AutomergeRepoKeyhive
) {
  const accountDocKey = `tinyPatchwork${hive ? "Keyhive" : ""}AccountUrl`;
  const existing = localStorage.getItem(accountDocKey) as
    | AutomergeUrl
    | undefined;

  if (existing) {
    return await repo.find<TinyPatchworkAccountDoc & HasPatchworkMetadata>(
      existing
    );
  }

  const rootFolderHandle = await repo.create2<FolderDoc & HasPatchworkMetadata>(
    {
      ["@patchwork"]: { type: "folder" },
      title: "root",
      docs: [],
    }
  );

  const moduleSettingsHandle = await repo.create2<
    ModuleSettingsDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "patchwork:module-settings" },
    modules: [],
  });

  const account = await repo.create2<
    TinyPatchworkAccountDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "account" },
    rootFolderUrl: rootFolderHandle.url,
    moduleSettingsUrl: moduleSettingsHandle.url,
    frameToolId: "patchwork-frame",
    accountSidebarToolId: "chee/sideboard",
    contextSidebarToolId: "context-sidebar",
    contextToolIds: ["comments-view", "history-view", "context-view"],
    documentToolbarToolIds: ["document-title", "back-link-button"],
  });
  localStorage.setItem(accountDocKey, account.url);
  return account;
}

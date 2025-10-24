import {
  FolderDoc,
  ModuleSettingsDoc,
  type HasPatchworkMetadata,
} from "@patchwork/filesystem";

import { AutomergeUrl, Repo } from "@automerge/vanillajs";
import type { AutomergeRepoKeyhive } from "virtual:patchwork/setup";
import { SingleViewDoc } from "../tools/single-view/datatype";
import { TabbedViewDoc } from "../tools/tabbed-view/datatype";

export type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
  frameToolId: string;
  sidebarToolId?: string;
  mainView: {
    documentUrl: AutomergeUrl;
    toolId: string;
  };
  contextSidebar: {
    documentUrl: AutomergeUrl;
    toolId: string;
  };
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

  // Create a tab-view document for the main view
  const singleViewHandle = await repo.create2<
    SingleViewDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "single-view" },
    highlightChanges: false,
  });

  const historyViewHandle = await repo.create2<HasPatchworkMetadata>({
    ["@patchwork"]: { type: "history-view" },
  });

  const commentsViewHandle = await repo.create2<HasPatchworkMetadata>({
    ["@patchwork"]: { type: "comments-view" },
  });

  const contextSidebarDocHandle = await repo.create2<
    TabbedViewDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "tab-view" },
    activeTabIndex: 0,
    tabs: [
      {
        url: commentsViewHandle.url,
        toolId: "comments-view",
        name: "Comments",
      },
      { url: historyViewHandle.url, toolId: "history-view", name: "History" },
    ],
    showCloseButton: false,
  });

  const account = await repo.create2<
    TinyPatchworkAccountDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "account" },
    rootFolderUrl: rootFolderHandle.url,
    frameToolId: "patchwork-frame",
    sidebarToolId: "chee/sideboard",
    moduleSettingsUrl: moduleSettingsHandle.url,
    contextSidebar: {
      documentUrl: contextSidebarDocHandle.url,
      toolId: "tabbed-view",
    },
    mainView: { documentUrl: singleViewHandle.url, toolId: "single-view" },
  });
  localStorage.setItem(accountDocKey, account.url);
  return account;
}

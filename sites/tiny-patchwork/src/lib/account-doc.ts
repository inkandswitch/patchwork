import {
  FolderDoc,
  ModuleSettingsDoc,
  type HasPatchworkMetadata,
} from "@patchwork/filesystem";

import { AutomergeUrl, Repo } from "@automerge/vanillajs";
import { SingleViewDoc } from "../tools/single-view/datatype";

export type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
  frameToolId: string;
  sidebarToolId?: string;
  mainView: {
    documentUrl: AutomergeUrl;
    toolId: string;
  };
  contextSidebarToolId?: string;
};

const accountDocKey = "tinyPatchworkAccountUrl";

function getExisting() {
  return localStorage.getItem(accountDocKey) as AutomergeUrl | undefined;
}

export async function getOrCreateAccountDocHandle(repo: Repo) {
  const existing = getExisting();
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

  return await repo.create2<TinyPatchworkAccountDoc & HasPatchworkMetadata>({
    ["@patchwork"]: { type: "account" },
    frameToolId: "patchwork-frame",
    sidebarToolId: "simple-sidebar",
    contextSidebarToolId: "history-view",
    rootFolderUrl: rootFolderHandle.url,
    moduleSettingsUrl: moduleSettingsHandle.url,
    mainView: { documentUrl: singleViewHandle.url, toolId: "single-view" },
  });
}

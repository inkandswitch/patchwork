import { DocLink, FolderDoc, ModuleSettingsDoc } from "@patchwork/filesystem";

import { AutomergeUrl, DocHandle, Repo } from "@automerge/vanillajs";

export type TinyPatchworkAccountDoc = {
  ["@tiny-patchwork"]: {
    rootFolderUrl: AutomergeUrl;
    moduleSettingsUrl: AutomergeUrl;
    frameToolId: string;
    sidebarToolId: string;
    selectedDocLink?: DocLink;
  };
};

export const initAccountDoc = (
  repo: Repo,
  handle: DocHandle<Partial<TinyPatchworkAccountDoc>>
) => {
  const tinyPatchworkConfig = handle.doc()["@tiny-patchwork"];

  if (tinyPatchworkConfig) {
    return;
  }

  const rootFolderHandle = repo.create<FolderDoc>();
  rootFolderHandle.change((doc) => {
    (doc as any)["@patchwork"] = {
      type: "folder",
    };
    doc.title = "root";
    doc.docs = [];
  });

  const moduleSettingsHandle = repo.create<ModuleSettingsDoc>();
  moduleSettingsHandle.change((doc) => {
    doc.modules = [
      //rootDirectoryUrl as AutomergeUrl,
      //"automerge:3oivpA9JtHpaZme42DTToAZD8Hts" as AutomergeUrl,
    ];
  });

  handle.change((doc) => {
    (doc as any)["@patchwork"] = {
      type: "account",
    };

    doc["@tiny-patchwork"] = {
      frameToolId: "patchwork-frame",
      sidebarToolId: "simple-sidebar",
      rootFolderUrl: rootFolderHandle.url,
      moduleSettingsUrl: moduleSettingsHandle.url,
    };
  });
};

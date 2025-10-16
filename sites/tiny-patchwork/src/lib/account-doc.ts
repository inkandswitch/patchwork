import { FolderDoc, ModuleSettingsDoc } from "@patchwork/filesystem";

import { AutomergeUrl, DocHandle, Repo } from "@automerge/vanillajs";
import { SingleViewDoc } from "../tools/single-view/datatype";

export type TinyPatchworkAccountDoc = {
  ["@tiny-patchwork"]: {
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
};

export const initAccountDoc = async (
  repo: Repo,
  handle: DocHandle<Partial<TinyPatchworkAccountDoc>>
) => {
  const tinyPatchworkConfig = handle.doc()["@tiny-patchwork"];

  // todo(2025-10) remove when everyone's probably been updated
  if (tinyPatchworkConfig) {
    const { moduleSettingsUrl } = tinyPatchworkConfig;

    const moduleSettings =
      await repo.find<ModuleSettingsDoc>(moduleSettingsUrl);

    if (!moduleSettings.doc()["@patchwork"]) {
      moduleSettings.change((doc) => {
        doc["@patchwork"] = { type: "patchwork:module-settings" };
      });
    }

    const rootFolderToolId =
      "rootFolderToolId" in tinyPatchworkConfig &&
      tinyPatchworkConfig.rootFolderToolId;

    if (typeof rootFolderToolId == "string") {
      handle.change((doc) => {
        doc["@tiny-patchwork"]!.sidebarToolId = rootFolderToolId;
        delete (doc["@tiny-patchwork"]! as any).rootFolderToolId;
      });
    }

    return;
  }

  const rootFolderHandle = (await repo.create2({
    ["@patchwork"]: {
      type: "folder",
    },
    title: "root",
    docs: [],
  })) as DocHandle<FolderDoc>;

  const moduleSettingsHandle = (await repo.create2({
    ["@patchwork"]: {
      type: "patchwork:module-settings",
    },
    modules: [],
  })) as DocHandle<ModuleSettingsDoc>;
  moduleSettingsHandle.change((doc) => {
    doc.modules = [
      //rootDirectoryUrl as AutomergeUrl,
      //"automerge:3oivpA9JtHpaZme42DTToAZD8Hts" as AutomergeUrl,
    ];
  });

  // Create a tab-view document for the main view
  const singleViewHandle = (await repo.create2({
    ["@patchwork"]: {
      type: "single-view",
    },
  })) as DocHandle<SingleViewDoc>;

  handle.change((doc) => {
    (doc as any)["@patchwork"] = {
      type: "account",
    };

    doc["@tiny-patchwork"] = {
      frameToolId: "patchwork-frame",
      sidebarToolId: "simple-sidebar",
      contextSidebarToolId: "history-view",
      rootFolderUrl: rootFolderHandle.url,
      moduleSettingsUrl: moduleSettingsHandle.url,
      mainView: {
        documentUrl: singleViewHandle.url,
        toolId: "single-view",
      },
    };
  });
};

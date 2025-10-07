import { rootDirectoryUrl } from "../../.pushwork/snapshot.json";
import { FolderDoc, ModuleSettingsDoc } from "@patchwork/filesystem";

// todo: this will be removed once we have keyhive

console.log("rootDirectoryUrl", rootDirectoryUrl);

import { AutomergeUrl, DocHandle, Repo } from "@automerge/vanillajs";
import { PatchworkFrameDoc } from "../tools/PatchworkFrame";

export type AccountDoc = {
  rootToolId: string;
  rootFolderUrl: AutomergeUrl;
  rootDocUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
};

export const getAccountDocHandle = (
  repo: Repo
): Promise<DocHandle<AccountDoc>> => {
  const accountDocUrl = localStorage.getItem(
    "tiny-patchwork:accountDocUrl"
  ) as AutomergeUrl;

  if (!accountDocUrl) {
    const accountDocHandle = repo.create<AccountDoc>();

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

    const frameDocHandle = repo.create<PatchworkFrameDoc>();
    frameDocHandle.change((doc) => {
      doc.sidebarToolId = "simple-sidebar";
    });

    accountDocHandle.change((doc) => {
      doc.rootToolId = "patchwork-frame";
      doc.rootDocUrl = frameDocHandle.url;
      doc.rootFolderUrl = rootFolderHandle.url;
      doc.moduleSettingsUrl = moduleSettingsHandle.url;
    });

    localStorage.setItem("tiny-patchwork:accountDocUrl", accountDocHandle.url);

    return Promise.resolve(accountDocHandle);
  }

  return repo.find<AccountDoc>(accountDocUrl);
};

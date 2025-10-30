import {
  AutomergeUrl,
  DocHandle,
  encodeHeads,
  isValidAutomergeUrl,
  Repo,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import { Automerge } from "@automerge/automerge-repo/slim";
import {
  FolderDoc,
  HasPatchworkMetadata,
  ModuleSettingsDoc,
} from "@patchwork/filesystem";
import { TinyPatchworkAccountDoc } from "./lib/account-doc";

export const initCommands = (
  accountDocHandle: DocHandle<TinyPatchworkAccountDoc>,
  repo: Repo
) => {
  const setAccountSidebarToolId = (sidebarToolId: string) => {
    accountDocHandle.change((doc) => {
      doc.accountSidebarToolId = sidebarToolId;
    });
  };

  const funkySidebar = () => {
    setAccountSidebarToolId("funky-sidebar");
    console.log("Switched to funky sidebar");
  };

  const normalSidebar = () => {
    setAccountSidebarToolId("simple-sidebar");
    console.log("Switched to normal sidebar");
  };

  const installModule = async (url: AutomergeUrl) => {
    if (!isValidAutomergeUrl(url)) {
      throw new Error("Invalid URL");
    }

    const moduleDocHandle = await repo.find<HasPatchworkMetadata>(url);
    if (!moduleDocHandle) {
      throw new Error("Module not found");
    }

    const moduleSettingsHandle = await repo.find<ModuleSettingsDoc>(
      accountDocHandle.doc().moduleSettingsUrl
    );

    moduleSettingsHandle.change((doc) => {
      const doesModuleAlreadyExist = doc.modules.includes(url);
      if (doesModuleAlreadyExist) {
        console.log("Module already installed, skipping");
        return;
      } else {
        console.log("Installed module", url);
      }

      doc.modules.push(url);
    });
  };

  const copyCurrentDoc = async () => {
    const currentDocHandle = (window as any)
      .handle as DocHandle<HasPatchworkMetadata>;
    const repo = (window as any).repo as Repo;
    if (!currentDocHandle) {
      return;
    }

    const rootFolderDocHandle = await repo.find<FolderDoc>(
      accountDocHandle.doc().rootFolderUrl
    );

    const originalDocLink = rootFolderDocHandle
      .doc()
      .docs.find((doc) => doc.url === currentDocHandle.url);
    if (!originalDocLink) {
      console.log("can only copy docs that are in the root folder");
      return;
    }

    const copyDocHandle = await repo.create2<HasPatchworkMetadata>();

    copyDocHandle.update(() => {
      return Automerge.clone(currentDocHandle.doc());
    });

    copyDocHandle.change((doc) => {
      const heads = encodeHeads(Automerge.getHeads(currentDocHandle.doc()));

      doc["@patchwork"].copyOf = stringifyAutomergeUrl({
        documentId: currentDocHandle.documentId,
        heads,
      });
    });

    currentDocHandle.change((doc) => {
      if (!doc["@patchwork"].copies) {
        doc["@patchwork"].copies = [];
      }

      doc["@patchwork"].copies.push(copyDocHandle.url);
    });

    rootFolderDocHandle.change((doc) => {
      doc.docs.push({
        name: originalDocLink.name,
        type: originalDocLink.type,
        url: copyDocHandle.url,
      });
    });
  };

  const initDefaultToolbarItems = async () => {
    const mainViewDocHandle = await repo.find<MainViewDoc>(
      accountDocHandle.doc().mainView.documentUrl
    );

    mainViewDocHandle.change((doc) => {
      doc.toolbarItems = [
        { docUrl: "currentDoc", toolId: "document-title" },
        { docUrl: "currentDoc", toolId: "back-link-button" },
      ];
    });
  };

  const addTabbedSidebar = async () => {
    // Create history and comments view documents
    const historyViewHandle = await repo.create2<HasPatchworkMetadata>({
      ["@patchwork"]: { type: "history-view" },
    });

    const commentsViewHandle = await repo.create2<HasPatchworkMetadata>({
      ["@patchwork"]: { type: "comments-view" },
    });

    // Create a new tabbed sidebar document
    const tabbedSidebarHandle = await repo.create2<
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

    // Update the account document to use the new tabbed sidebar
    accountDocHandle.change((doc) => {
      doc.contextSidebar = {
        documentUrl: tabbedSidebarHandle.url,
        toolId: "tabbed-view",
      };
    });

    console.log("Added tabbed sidebar");
  };

  // Attach to window
  (window as any).$command = {
    funkySidebar,
    normalSidebar,
    setAccountSidebarToolId,
    copyCurrentDoc,
    installModule,
  };
};

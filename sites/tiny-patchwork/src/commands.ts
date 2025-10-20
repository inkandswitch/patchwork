import {
  DocHandle,
  encodeHeads,
  Repo,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import { TinyPatchworkAccountDoc } from "./lib/account-doc";
import { TabViewDoc } from "./tools/tab-view/datatype";
import { SingleViewDoc } from "./tools/single-view/datatype";
import { BranchViewDoc } from "./tools/branch-view/datatype";
import { FolderDoc, HasPatchworkMetadata } from "@patchwork/filesystem";
import { Automerge } from "@automerge/automerge-repo/slim";

export const initCommands = (
  accountDocHandle: DocHandle<TinyPatchworkAccountDoc>,
  repo: Repo
) => {
  const funkySidebar = () => {
    accountDocHandle.change((doc) => {
      doc.sidebarToolId = "funky-sidebar";
    });
    console.log("Switched to funky sidebar");
  };

  const normalSidebar = () => {
    accountDocHandle.change((doc) => {
      doc.sidebarToolId = "simple-sidebar";
    });
    console.log("Switched to normal sidebar");
  };

  const tabView = async () => {
    // Create a new tab-view document
    const tabViewHandle = (await repo.create2({
      ["@patchwork"]: {
        type: "tab-view",
      },
      tabs: [],
    })) as DocHandle<TabViewDoc>;

    accountDocHandle.change((doc) => {
      doc.mainView = {
        documentUrl: tabViewHandle.url,
        toolId: "tab-view",
      };
    });
    console.log("Switched to tab view");
  };

  const singleView = async () => {
    // Create a new single-view document
    const singleViewHandle = (await repo.create2({
      ["@patchwork"]: {
        type: "single-view",
      },
      highlightChanges: false,
    })) as DocHandle<SingleViewDoc>;

    accountDocHandle.change((doc) => {
      doc.mainView = {
        documentUrl: singleViewHandle.url,
        toolId: "single-view",
      };
    });
    console.log("Switched to single view");
  };

  const branchView = async () => {
    // Create a new branch-view document
    const branchViewHandle = (await repo.create2({
      ["@patchwork"]: {
        type: "branch-view",
      },
    })) as DocHandle<BranchViewDoc>;

    accountDocHandle.change((doc) => {
      doc.mainView = {
        documentUrl: branchViewHandle.url,
        toolId: "branch-view",
      };
    });
    console.log("Switched to branch view");
  };

  const historyView = async () => {
    accountDocHandle.change((doc) => {
      doc.contextSidebarToolId = "history-view";
    });
  };

  const commentsView = () => {
    accountDocHandle.change((doc) => {
      doc.contextSidebarToolId = "comments-view";
    });
  };

  const copyCurrentDoc = async () => {
    const currentDocHandle = (window as any)
      .currentDocHandle as DocHandle<HasPatchworkMetadata>;
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

  // Attach to window
  (window as any).$command = {
    funkySidebar,
    normalSidebar,
    tabView,
    singleView,
    branchView,
    historyView,
    commentsView,
    copyCurrentDoc,
  };
};

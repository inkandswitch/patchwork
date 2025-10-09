import { DocHandle, Repo } from "@automerge/automerge-repo";
import { TinyPatchworkAccountDoc } from "./lib/account-doc";
import { TabViewDoc } from "./tools/tab-view/datatype";
import { SingleViewDoc } from "./tools/single-view/datatype";

declare global {
  interface Window {
    $command: {
      switchToFunkySidebar: () => void;
      switchToNormalSidebar: () => void;
      switchToTabView: () => void;
      switchToSingleView: () => void;
    };
  }
}

export const initCommands = (
  accountDocHandle: DocHandle<TinyPatchworkAccountDoc>,
  repo: Repo
) => {
  const switchToFunkySidebar = () => {
    accountDocHandle.change((doc) => {
      doc["@tiny-patchwork"].sidebarToolId = "funky-sidebar";
    });
    console.log("Switched to funky sidebar");
  };

  const switchToNormalSidebar = () => {
    accountDocHandle.change((doc) => {
      doc["@tiny-patchwork"].sidebarToolId = "simple-sidebar";
    });
    console.log("Switched to normal sidebar");
  };

  const switchToTabView = () => {
    // Create a new tab-view document
    const tabViewHandle = repo.create({
      ["@patchwork"]: {
        type: "tab-view",
      },
      tabs: [],
    }) as DocHandle<TabViewDoc>;

    accountDocHandle.change((doc) => {
      doc["@tiny-patchwork"].mainView = {
        documentUrl: tabViewHandle.url,
        toolId: "tab-view",
      };
    });
    console.log("Switched to tab view");
  };

  const switchToSingleView = () => {
    // Create a new single-view document
    const singleViewHandle = repo.create({
      ["@patchwork"]: {
        type: "single-view",
      },
    }) as DocHandle<SingleViewDoc>;

    accountDocHandle.change((doc) => {
      doc["@tiny-patchwork"].mainView = {
        documentUrl: singleViewHandle.url,
        toolId: "single-view",
      };
    });
    console.log("Switched to single view");
  };

  // Attach to window
  window.$command = {
    switchToFunkySidebar,
    switchToNormalSidebar,
    switchToTabView,
    switchToSingleView,
  };

  console.log("Commands initialized. Available commands:");
  console.log("- $command.switchToFunkySidebar()");
  console.log("- $command.switchToNormalSidebar()");
  console.log("- $command.switchToTabView()");
  console.log("- $command.switchToSingleView()");
};

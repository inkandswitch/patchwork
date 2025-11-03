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
import type { CommandItem } from "./lib/commands/CommandPalette";
import { TinyPatchworkAccountDoc } from "./lib/account-doc";
import { BranchViewDoc } from "./tools/branch-view/datatype";
import { SingleViewDoc } from "./tools/single-view/datatype";
import { TabbedViewDoc } from "./tools/tabbed-view/datatype";

// Convert kebab-case to camelCase
const toCamelCase = (str: string) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

export const commands = (
  accountDocHandle: DocHandle<TinyPatchworkAccountDoc>,
  repo: Repo
): CommandItem[] => [
  {
    id: "funky-sidebar",
    label: "Switch to Funky Sidebar",
    description: "Use the funky sidebar view",
    category: "Layout",
    action: () => {
      accountDocHandle.change((doc) => {
        doc.sidebarToolId = "funky-sidebar";
      });
      console.log("Switched to funky sidebar");
    },
  },
  {
    id: "normal-sidebar",
    label: "Switch to Normal Sidebar",
    description: "Use the simple sidebar view",
    category: "Layout",
    action: () => {
      accountDocHandle.change((doc) => {
        doc.sidebarToolId = "simple-sidebar";
      });
      console.log("Switched to normal sidebar");
    },
  },
  {
    id: "single-view",
    label: "Switch to Single View",
    description: "Create and switch to a single-view layout",
    category: "Layout",
    action: async () => {
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
    },
  },
  {
    id: "branch-view",
    label: "Switch to Branch View",
    description: "Create and switch to a branch-view layout",
    category: "Layout",
    action: async () => {
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
    },
  },
  {
    id: "set-sidebar-tool-id",
    label: "Set Sidebar Tool ID",
    description: "Change the sidebar to a specific tool by ID",
    category: "Layout",
    action: (sidebarToolId: string) => {
      accountDocHandle.change((doc) => {
        doc.sidebarToolId = sidebarToolId;
      });
    },
    args: [
      {
        name: "Tool ID",
        placeholder: "e.g. simple-sidebar, funky-sidebar",
        description: "The ID of the tool to display in the sidebar",
      },
    ],
  },
  {
    id: "add-context-inspector",
    label: "Add Context Inspector",
    description: "Add a context inspector to the sidebar",
    category: "Tools",
    action: async () => {
      const contextInspectorHandle = await repo.create2<HasPatchworkMetadata>({
        ["@patchwork"]: { type: "patchwork/context-inspector" },
      });

      accountDocHandle.change((doc) => {
        doc.contextSidebar = {
          documentUrl: contextInspectorHandle.url,
          toolId: "context-inspector",
        };
      });

      console.log("Added context inspector");
    },
  },
  {
    id: "add-tabbed-sidebar",
    label: "Add Tabbed Sidebar",
    description: "Add a tabbed sidebar with comments and history",
    category: "Tools",
    action: async () => {
      const historyViewHandle = await repo.create2<HasPatchworkMetadata>({
        ["@patchwork"]: { type: "history-view" },
      });

      const commentsViewHandle = await repo.create2<HasPatchworkMetadata>({
        ["@patchwork"]: { type: "comments-view" },
      });

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
          {
            url: historyViewHandle.url,
            toolId: "history-view",
            name: "History",
          },
        ],
        showCloseButton: false,
      });

      accountDocHandle.change((doc) => {
        doc.contextSidebar = {
          documentUrl: tabbedSidebarHandle.url,
          toolId: "tabbed-view",
        };
      });

      console.log("Added tabbed sidebar");
    },
  },
  {
    id: "add-context-tab",
    label: "Add Context Tab",
    description: "Add a new tab to the context sidebar",
    category: "Tools",
    action: async (docUrl: AutomergeUrl, toolId: string) => {
      const tabbedViewDocHandle = await repo.find<TabbedViewDoc>(
        accountDocHandle.doc().contextSidebar.documentUrl
      );

      tabbedViewDocHandle.change((doc) => {
        doc.tabs.push({
          url: docUrl,
          toolId,
        });
      });
    },
    args: [
      {
        name: "Document URL",
        placeholder: "automerge:...",
        description: "The Automerge URL of the document to add",
      },
      {
        name: "Tool ID",
        placeholder: "e.g. history-view, comments-view",
        description: "The ID of the tool to use for this tab",
      },
    ],
  },
  {
    id: "install-module",
    label: "Install Module",
    description: "Install a module from an Automerge URL",
    category: "Tools",
    action: async (url: AutomergeUrl) => {
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
    },
    args: [
      {
        name: "Module URL",
        placeholder: "automerge:...",
        description: "The Automerge URL of the module to install",
      },
    ],
  },
  {
    id: "copy-current-doc",
    label: "Copy Current Document",
    description: "Create a copy of the currently open document",
    category: "Document",
    action: async () => {
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
    },
  },
];

export const initCommands = (
  accountDocHandle: DocHandle<TinyPatchworkAccountDoc>,
  repo: Repo
) => {
  const commandList = commands(accountDocHandle, repo);

  // Attach to window
  (window as any).commands = commandList;
  (window as any).$command = Object.fromEntries(
    commandList.map((cmd) => [toCamelCase(cmd.id), cmd.action])
  );
};

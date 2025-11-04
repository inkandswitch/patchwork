import {
  type AutomergeUrl,
  DocHandle,
  encodeHeads,
  isValidAutomergeUrl,
  Repo,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import { Automerge } from "@automerge/automerge-repo/slim";
import type {
  FolderDoc,
  HasPatchworkMetadata,
  ModuleSettingsDoc,
} from "@patchwork/filesystem";
import type { CommandItem } from "./CommandPalette";
// TODO: this aint good...knows too much, will fix soon...
import type { TinyPatchworkLayoutDoc } from "../../../sites/tiny-patchwork/src/layout-doc";

// Convert kebab-case to camelCase
const toCamelCase = (str: string) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

export const commands = (
  accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>,
  repo: Repo
): CommandItem[] => [
  {
    id: "funky-sidebar",
    label: "Switch to Funky Sidebar",
    description: "Use the funky sidebar view",
    category: "Layout",
    action: () => {
      accountDocHandle.change((doc) => {
        doc.accountSidebarToolId = "funky-sidebar";
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
        doc.accountSidebarToolId = "chee/sideboard";
      });
      console.log("Switched to normal sidebar");
    },
  },

  {
    id: "set-sidebar-tool-id",
    label: "Set Sidebar Tool ID",
    description: "Change the sidebar to a specific tool by ID",
    category: "Layout",
    action: (sidebarToolId: string) => {
      accountDocHandle.change((doc) => {
        doc.accountSidebarToolId = sidebarToolId;
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
      accountDocHandle.change((doc) => {
        doc.contextToolIds.push("context-inspector");
      });
    },
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
  accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>,
  repo: Repo
) => {
  const commandList = commands(accountDocHandle, repo);

  // Attach to window
  (window as any).commands = commandList;
  (window as any).$command = Object.fromEntries(
    commandList.map((cmd) => [toCamelCase(cmd.id), cmd.action])
  );
};

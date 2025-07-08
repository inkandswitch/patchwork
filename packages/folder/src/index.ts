import type { AutomergeUrl } from "@automerge/automerge-repo";

export type {
  FolderDoc,
  FolderDocMaterialized as FolderDocWithChildren,
} from "./datatype";

import type { LoadablePlugin, Plugin } from "@patchwork/sdk";

export const plugins: LoadablePlugin<any>[] = [
  {
    type: "patchwork:dataType",
    id: "folder",
    name: "Folder",
    icon: "Folder",
    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "folder-embeds",
    name: "Embeds",
    supportedDataTypes: ["folder"],

    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];

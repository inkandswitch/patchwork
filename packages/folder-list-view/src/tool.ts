import { Tool } from "@patchwork/sdk";
import { FolderViewerList } from "./components/FolderListView";

export const tool: Tool = {
  type: "patchwork:tool",
  id: "folder-view-list",
  name: "List",
  supportedDataTypes: ["folder"],
  EditorComponent: FolderViewerList,
};

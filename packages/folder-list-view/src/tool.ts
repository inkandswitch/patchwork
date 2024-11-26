import { Tool } from "@patchwork/sdk";
import { FolderViewerList } from "./components/FolderListView";

export const folderViewerListTool: Tool = {
  type: "patchwork:tool",
  id: "folder-view-list",
  name: "List",
  EditorComponent: FolderViewerList,
  supportedDataTypes: ["folder"],
};

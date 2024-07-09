import { Tool } from "@/sdk";
import { FolderViewerList } from "./components/FolderListView";

export const folderViewerListTool: Tool = {
  type: "patchwork:tool",
  id: "folder-view-list",
  name: "List",
  editorComponent: FolderViewerList,
  supportedDataTypes: ["folder"],
};

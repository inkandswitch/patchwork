import { makeTool } from "@patchwork/sdk";
import { FolderViewerList } from "./components/FolderListView";

export const tool = makeTool({
  EditorComponent: FolderViewerList,
});

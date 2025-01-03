import {
  makeTool,
  type DataTypeDescription,
  type ToolDescription,
} from "@patchwork/sdk";
import type { NoticeableDoc } from "./datatype";

export const dataType: DataTypeDescription<NoticeableDoc> = {
  type: "patchwork:dataType",
  id: "noticeable-notebook",
  name: "Noticeable Notebook",
  icon: "NotebookTabs",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "noticeable-notebook",
    name: "Noticeable Notebook",
    supportedDataTypes: ["noticeable-notebook"],
    async load() {
      const { NoticeableEditor } = await import(
        "./components/NoticeableEditor"
      );
      return makeTool({
        EditorComponent: NoticeableEditor,
      });
    },
  },
];

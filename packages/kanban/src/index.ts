import type { KanbanBoardDoc } from "./datatype";
import type { LoadableDataType, ToolDescription } from "@patchwork/sdk";

// For others to enjoy
export type { KanbanBoardDoc };

export const dataType: LoadableDataType<KanbanBoardDoc, never, never> = {
  type: "patchwork:dataType",
  id: "kanban",
  name: "Kanban Board",
  icon: "SquareKanban",

  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "kanban",
    name: "Kanban",
    supportedDataTypes: ["kanban"],

    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];

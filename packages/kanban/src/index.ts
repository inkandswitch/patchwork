import type { KanbanBoardDoc } from "./datatype";
import type { DeferredDataType, DeferredTool } from "@patchwork/sdk";

// For others to enjoy
export type { KanbanBoardDoc };

export const dataType: DeferredDataType<KanbanBoardDoc, never, never> = {
  type: "patchwork:dataType",
  id: "kanban",
  name: "Kanban Board",
  icon: "KanbanSquare",

  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: DeferredTool[] = [
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

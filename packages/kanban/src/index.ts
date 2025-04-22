import type { KanbanBoardDoc } from "./datatype";
import type { LoadablePlugin } from "@patchwork/sdk";

// For others to enjoy
export type { KanbanBoardDoc };

export const plugins: LoadablePlugin<any>[] = [
  {
    type: "patchwork:dataType",
    id: "kanban",
    name: "Kanban Board",
    icon: "SquareKanban",

    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
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

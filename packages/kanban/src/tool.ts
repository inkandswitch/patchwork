import { makeTool } from "@patchwork/sdk";
import { KanbanBoard } from "./KanbanBoard";

export const tool = makeTool({
  type: "patchwork:tool",
  id: "kanban",
  name: "Kanban",
  supportedDataTypes: ["kanban"],
  EditorComponent: KanbanBoard,
});

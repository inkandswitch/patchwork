import { makeTool } from "@patchwork/sdk";
import { KanbanBoard } from "./KanbanBoard";

export const kanbanTool = makeTool({
  type: "patchwork:tool",
  id: "kanban",
  name: "Kanban",
  supportedDataTypes: ["kanban"],
  EditorComponent: KanbanBoard,
});

import { Tool } from "@/tools";
import { KanbanBoard } from "./KanbanBoard";

export const kanbanTool: Tool = {
  type: "patchwork:tool",
  id: "kanban",
  name: "Kanban",
  supportedDataTypes: ["kanban"],
  editorComponent: KanbanBoard,
};

import { makeTool } from "@patchwork/sdk";
import { KanbanBoard } from "./KanbanBoard";

export const tool = makeTool({
  EditorComponent: KanbanBoard,
});

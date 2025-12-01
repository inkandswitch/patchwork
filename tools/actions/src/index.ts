import { type Plugin } from "@patchwork/plugins";
import { actionRunnerTool } from "./actionRunner";
import { createDocumentAction } from "./createDocument";
import { deleteAction } from "./delete";
import { insertAction } from "./insert";
import { updateAction } from "./update";

import "./index.css";

export const plugins: Plugin<any>[] = [
  createDocumentAction as any,
  updateAction as any,
  deleteAction as any,
  insertAction as any,
  actionRunnerTool as any,
];

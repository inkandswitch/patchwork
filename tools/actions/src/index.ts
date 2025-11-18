import { type Plugin } from "@patchwork/plugins";
import { toolify } from "@patchwork/react";
import { createDocumentAction } from "./createDocument";
import { updateAction } from "./update";
import { deleteAction } from "./delete";
import { insertAction } from "./insert";

import "./index.css";

export const plugins: Plugin<any>[] = [
  createDocumentAction as any,
  updateAction as any,
  deleteAction as any,
  insertAction as any,
];

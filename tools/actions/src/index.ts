import { type Plugin } from "@patchwork/plugins";
import { toolify } from "@patchwork/react";
import { actionAIPrompt } from "./aiPrompt";
import { createDocumentAction } from "./createDocument";
import { updateAction } from "./update";
import { deleteAction } from "./delete";
import { insertAction } from "./insert";

import "./index.css";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "actions",
    name: "Actions",
    icon: "CirclePlus",
    supportedDataTypes: "*",
    async load() {
      const { Tool } = await import("./tool");
      return toolify(Tool);
    },
  },
  actionAIPrompt as any,
  createDocumentAction as any,
  updateAction as any,
  deleteAction as any,
  insertAction as any,
];

import { DataTypeImplementation } from "@patchwork/plugins";
import { TodoDoc } from "./Todo";

export const TodoDataType: DataTypeImplementation<TodoDoc> = {
  init: (doc: TodoDoc) => {
    doc.title = "My Todo List";
    doc.todos = [];
  },
  getTitle(doc: TodoDoc) {
    return doc.title || "Todo List";
  },
};

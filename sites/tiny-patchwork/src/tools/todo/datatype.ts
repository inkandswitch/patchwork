import { DataTypeImplementation } from "@patchwork/plugins";
import { TodoDoc } from "./Todo";

export const TodoDataType: DataTypeImplementation<TodoDoc> = {
  init: (doc: TodoDoc) => {
    doc.title = "My Todo List";
    doc.todos = [];
  },
  async getTitle(doc: TodoDoc) {
    return doc.title || "Todo List";
  },
  markCopy: (doc: TodoDoc) => {
    doc.title = doc.title;
    doc.todos = doc.todos;
  },
};

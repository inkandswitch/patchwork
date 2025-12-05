import { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";
import { TodoDoc } from "./Todo";

export const TodoDatatype: DatatypeImplementation<TodoDoc> = {
  init: (doc: TodoDoc) => {
    doc.title = "My Todo List";
    doc.todos = [];
  },
  getTitle(doc: TodoDoc) {
    return doc.title || "Todo List";
  },
};

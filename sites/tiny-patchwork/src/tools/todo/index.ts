import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "todo",
    name: "Todo List",
    icon: "ListTodo",
    supportedDataTypes: ["todo"],
    async load() {
      const { renderTodoEditor } = await import("./Todo");
      return renderTodoEditor;
    },
  },
  {
    type: "patchwork:datatype",
    id: "todo",
    name: "Todo List",
    icon: "ListTodo",
    async load() {
      const { TodoDataType } = await import("./datatype");
      return TodoDataType;
    },
  },
];

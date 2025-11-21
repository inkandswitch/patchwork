import { type Plugin } from "@patchwork/plugins";
import { type DocHandle } from "@automerge/automerge-repo";
import { z } from "zod";
import { TodoDoc } from "./Todo";

type Todo = {
  id: string;
  description: string;
  done: boolean;
};

// Add a new todo item
export const addTodoAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-add",
  name: "Add Todo",
  icon: "Plus",
  supportedDataTypes: ["todo"],
  module: {
    argsSchema: () => {
      return z.object({
        description: z.string().describe("Description of the todo item"),
        done: z
          .boolean()
          .optional()
          .default(false)
          .describe("Whether the todo is already completed"),
      });
    },
    default: (
      handle: DocHandle<TodoDoc>,
      _repo: any,
      args: { description: string; done?: boolean }
    ) => {
      handle.change((doc) => {
        const newTodo: Todo = {
          id: crypto.randomUUID(),
          description: args.description,
          done: args.done || false,
        };
        if (!doc.todos) {
          doc.todos = [];
        }
        doc.todos.push(newTodo);
      });
    },
  },
};

// Toggle a todo item's completion status
export const toggleTodoAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-toggle",
  name: "Toggle Todo",
  icon: "CheckSquare",
  supportedDataTypes: ["todo"],
  module: {
    argsSchema: (doc: TodoDoc) => {
      // Get list of todo IDs for the enum
      const todoOptions = (doc.todos || []).map((todo) => todo.id);

      return z.object({
        todoId: z
          .enum(todoOptions as [string, ...string[]])
          .describe("ID of the todo item to toggle"),
      });
    },
    isApplicable: (doc: TodoDoc) => {
      return doc.todos && doc.todos.length > 0;
    },
    default: (
      handle: DocHandle<TodoDoc>,
      _repo: any,
      args: { todoId: string }
    ) => {
      handle.change((doc) => {
        const todo = doc.todos.find((t) => t.id === args.todoId);
        if (todo) {
          todo.done = !todo.done;
        }
      });
    },
  },
};

// Delete a todo item
export const deleteTodoAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-delete",
  name: "Delete Todo",
  icon: "Trash2",
  supportedDataTypes: ["todo"],
  module: {
    argsSchema: (doc: TodoDoc) => {
      // Get list of todo IDs for the enum
      const todoOptions = (doc.todos || []).map((todo) => todo.id);

      return z.object({
        todoId: z
          .enum(todoOptions as [string, ...string[]])
          .describe("ID of the todo item to delete"),
      });
    },
    isApplicable: (doc: TodoDoc) => {
      return doc.todos && doc.todos.length > 0;
    },
    default: (
      handle: DocHandle<TodoDoc>,
      _repo: any,
      args: { todoId: string }
    ) => {
      handle.change((doc) => {
        const index = doc.todos.findIndex((t) => t.id === args.todoId);
        if (index !== -1) {
          doc.todos.splice(index, 1);
        }
      });
    },
  },
};

// Update todo description
export const updateTodoDescriptionAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-update-description",
  name: "Update Todo Description",
  icon: "Edit",
  supportedDataTypes: ["todo"],
  module: {
    argsSchema: (doc: TodoDoc) => {
      const todoOptions = (doc.todos || []).map((todo) => todo.id);

      return z.object({
        todoId: z
          .enum(todoOptions as [string, ...string[]])
          .describe("ID of the todo item to update"),
        description: z.string().describe("New description for the todo item"),
      });
    },
    isApplicable: (doc: TodoDoc) => {
      return doc.todos && doc.todos.length > 0;
    },
    default: (
      handle: DocHandle<TodoDoc>,
      _repo: any,
      args: { todoId: string; description: string }
    ) => {
      handle.change((doc) => {
        const todo = doc.todos.find((t) => t.id === args.todoId);
        if (todo) {
          todo.description = args.description;
        }
      });
    },
  },
};

// Clear all completed todos
export const clearCompletedTodosAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-clear-completed",
  name: "Clear Completed Todos",
  icon: "Eraser",
  supportedDataTypes: ["todo"],
  module: {
    isApplicable: (doc: TodoDoc) => {
      return doc.todos && doc.todos.some((todo) => todo.done);
    },
    default: (handle: DocHandle<TodoDoc>, _repo: any) => {
      handle.change((doc) => {
        doc.todos = doc.todos.filter((todo) => !todo.done);
      });
    },
  },
};

// Mark all todos as complete
export const markAllCompleteAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-mark-all-complete",
  name: "Mark All Complete",
  icon: "CheckCheck",
  supportedDataTypes: ["todo"],
  module: {
    isApplicable: (doc: TodoDoc) => {
      return doc.todos && doc.todos.some((todo) => !todo.done);
    },
    default: (handle: DocHandle<TodoDoc>, _repo: any) => {
      handle.change((doc) => {
        doc.todos.forEach((todo) => {
          todo.done = true;
        });
      });
    },
  },
};

// Mark all todos as incomplete
export const markAllIncompleteAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-mark-all-incomplete",
  name: "Mark All Incomplete",
  icon: "Square",
  supportedDataTypes: ["todo"],
  module: {
    isApplicable: (doc: TodoDoc) => {
      return doc.todos && doc.todos.some((todo) => todo.done);
    },
    default: (handle: DocHandle<TodoDoc>, _repo: any) => {
      handle.change((doc) => {
        doc.todos.forEach((todo) => {
          todo.done = false;
        });
      });
    },
  },
};

export const completeTodoAction: Plugin<any> = {
  type: "patchwork:action",
  id: "todo-complete",
  name: "Complete Todo",
  icon: "Check",
  supportedDataTypes: ["todo"],
  module: {
    argsSchema: () => ({
      todoId: {
        type: "string",
        description: "The id of the todo to mark as complete",
      },
    }),
    isApplicable: (doc: TodoDoc) => {
      return doc.todos && doc.todos.some((todo) => !todo.done);
    },
    default: (
      handle: DocHandle<TodoDoc>,
      _repo: any,
      args: { todoId: string }
    ) => {
      handle.change((doc) => {
        const todo = doc.todos.find((t) => t.id === args.todoId);
        if (todo) {
          todo.done = true;
        }
      });
    },
  },
};

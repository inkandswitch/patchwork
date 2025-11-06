import "./styles.css";
import {
  useDocHandle,
  useDocument,
} from "@automerge/automerge-repo-react-hooks";
import { useState } from "react";
import { PathRef, Ref } from "@patchwork/context";
import { getDiff } from "@patchwork/context-diff";
import { useReactive } from "@patchwork/context-react";
import { ReactToolProps, toolify } from "@patchwork/react";
import { classNames } from "@patchwork/util";

type Todo = {
  id: string;
  description: string;
  done: boolean;
};

export type TodoDoc = {
  title: string;
  todos: Todo[];
};

export const TodoEditor = ({ docUrl }: ReactToolProps) => {
  const [doc, changeDoc] = useDocument<TodoDoc>(docUrl);
  const docHandle = useDocHandle<TodoDoc>(docUrl);
  const [text, setText] = useState("");

  const addTodo = () => {
    if (text.trim() === "") return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      description: text,
      done: false,
    };
    changeDoc((doc) => {
      doc.todos.push(newTodo);
    });
    setText("");
  };

  const setTitle = (title: string) => {
    changeDoc((doc) => {
      doc.title = title;
    });
  };

  // hack: ignore
  if (
    !docHandle ||
    !docHandle.doc() ||
    !docHandle.doc().todos ||
    !doc ||
    !doc.todos ||
    docHandle.doc().todos.length !== doc.todos.length
  ) {
    return null;
  }

  return (
    <div className="p-4  h-full">
      <div className="max-w-[400px] mx-auto flex flex-col gap-2 dark:bg-base-300 bg-base-100 rounded-md p-4">
        <div className="text-2xl font-bold">
          <input
            type="text"
            value={doc.title}
            className="w-full"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="border-2 border-gray-300 rounded-md p-2 flex-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a new todo"
          />
          <button
            className="bg-blue-500 text-white rounded-md p-2"
            onClick={addTodo}
          >
            Add
          </button>
        </div>
        {doc.todos.map((todo, index) => {
          const todoRef = new PathRef<Todo>(docHandle, ["todos", index]);

          return <TodoItem key={todo.id} todoRef={todoRef} />;
        })}
      </div>
    </div>
  );
};

type TodoItemProps = {
  todoRef: Ref<Todo>;
};

const TodoItem = ({ todoRef }: TodoItemProps) => {
  const todo = todoRef.value;
  const diff = useReactive(getDiff(todoRef));

  const onToogle = () => {
    todoRef.change((todo) => {
      todo.done = !todo.done;
    });
  };

  const onChangeDescription = (e: React.ChangeEvent<HTMLInputElement>) => {
    todoRef.change((todo) => {
      todo.description = e.target.value;
    });
  };

  if (!todo) return null;

  return (
    <div
      className={classNames("flex gap-2 items-center px-2 py-1", {
        "line-through": todo.done,
        "bg-green-200": diff?.type === "added",
        "bg-yellow-200": diff?.type === "changed",
      })}
    >
      <input type="checkbox" checked={todo.done} onChange={onToogle} />
      <input
        className="flex-1"
        value={todo.description}
        onChange={onChangeDescription}
      />
    </div>
  );
};

export const renderTodoEditor = toolify(TodoEditor);

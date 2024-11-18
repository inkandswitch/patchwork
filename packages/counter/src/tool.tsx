import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@/tools";
import { CounterDoc } from "./datatype";
import React from "react";

export const Counter: React.FC<EditorProps<CounterDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument<CounterDoc>(docUrl);

  if (!doc) {
    return null;
  }

  const increment = () => {
    changeDoc((d) => {
      d.count += 1;
    });
  };

  const decrement = () => {
    changeDoc((d) => {
      d.count -= 1;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-4">{doc.title}</h2>
      <div className="text-4xl mb-4">{doc.count}</div>
      <div className="flex space-x-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={decrement}
        >
          -
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={increment}
        >
          +
        </button>
      </div>
    </div>
  );
};

export const counterTool = makeTool({
  type: "patchwork:tool",
  id: "counter",
  name: "Counter",
  supportedDataTypes: ["counter"],
  EditorComponent: Counter,
});

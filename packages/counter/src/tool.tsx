import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { Button } from "@patchwork/sdk/ui";
import { Doc } from "./datatype";
import React from "react";

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);

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
      <h2 className="text-4xl font-bold mb-4">{doc.title}</h2>
      <div className="text-4xl mb-4">{doc.count}</div>
      <div className="flex space-x-4">
        <Button variant="destructive" onClick={decrement}>
          -
        </Button>
        <Button variant="default" onClick={increment}>
          +
        </Button>
      </div>
    </div>
  );
};

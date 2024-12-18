import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { Doc } from "./datatype";
import React from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";

export const Counter: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
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
      <Scene />
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: Counter,
});

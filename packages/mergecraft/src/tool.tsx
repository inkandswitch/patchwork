import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { Doc } from "./datatype";
import React from "react";

import App from "./App";

export const Counter: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);

  if (!doc) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <App docUrl={docUrl} />
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: Counter,
});

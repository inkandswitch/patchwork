// TODO: don't import directly from core/src?
import { EditorProps, Tool } from "@patchwork/core/src/os/tools";

import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { HelloWorldDoc } from "./datatype";
import React from "react";

export const HelloWorldEditor = ({
  docUrl,
}: EditorProps<HelloWorldDoc, never>) => {
  const [doc, changeDoc] = useDocument<HelloWorldDoc>(docUrl);
  return <div>Message: {doc?.message}</div>;
};

export const helloWorldTool: Tool = {
  type: "patchwork:tool",
  id: "helloWorld",
  name: "Hello World",
  editorComponent: HelloWorldEditor,
  supportedDataTypes: ["helloWorld"],
};

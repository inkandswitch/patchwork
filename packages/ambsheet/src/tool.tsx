import { type EditorProps, type Tool, hashToColor } from "@patchwork/sdk";

import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { HelloWorldDoc } from "./datatype";

import * as Automerge from "@automerge/automerge";

import React from "react";

export const HelloWorldEditor = ({
  docUrl,
}: EditorProps<HelloWorldDoc, never>) => {
  const [doc] = useDocument<HelloWorldDoc>(docUrl);
  const heads = Automerge.getHeads(doc);
  const color = hashToColor(heads[0]);
  return <div style={{ backgroundColor: color }}>Hello there</div>;
};

export const helloWorldTool: Tool = {
  type: "patchwork:tool",
  id: "helloWorld",
  name: "Hello World",
  editorComponent: HelloWorldEditor,
  statusBarComponent: HelloWorldEditor,
  supportedDataTypes: "*",
};

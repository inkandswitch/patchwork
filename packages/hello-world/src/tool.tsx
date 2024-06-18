import { EditorProps, Tool } from "@patchwork/sdk";

import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { HelloWorldDoc } from "./datatype";

export const HelloWorldEditor = ({
  docUrl,
}: EditorProps<HelloWorldDoc, never>) => {
  const [doc] = useDocument<HelloWorldDoc>(docUrl);
  return <div>Message: {doc?.message}</div>;
};

export const helloWorldTool: Tool = {
  type: "patchwork:tool",
  id: "helloWorld",
  name: "Hello World",
  editorComponent: HelloWorldEditor,
  supportedDataTypes: ["helloWorld"],
};

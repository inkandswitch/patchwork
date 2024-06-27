import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, Tool } from "@/tools";
import { next as A } from "@automerge/automerge";
import { useMemo } from "react";
import { JacquardProjectDoc } from "./datatype";

export const JacquardProject = ({
  docUrl,
  docHeads,
}: EditorProps<never, string>) => {
  const [latestDoc] = useDocument<JacquardProjectDoc>(docUrl); // used to trigger re-rendering when tjacquardTool
  const handle = useHandle<JacquardProjectDoc>(docUrl);

  const doc = useMemo(
    () => (docHeads ? A.view(latestDoc, docHeads) : latestDoc),
    [latestDoc, docHeads]
  );

  if (!doc) {
    return null;
  }

  return (
    <div className="p-4">
      <h1>Jacquard!</h1>
      <div>Files:</div>
      <pre>{JSON.stringify(doc.fileContents, null, 2)}</pre>
    </div>
  );
};

export const jacquardTool: Tool = {
  type: "patchwork:tool",
  id: "jacquard-project",
  name: "Jacquard",
  supportedDataTypes: ["jacquard-project"],
  editorComponent: JacquardProject,
};

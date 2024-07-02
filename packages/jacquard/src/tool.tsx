import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, Tool } from "@/tools";
import { next as A } from "@automerge/automerge";
import { useMemo, useState } from "react";
import { JacquardBuildMetadata } from "./datatype";

export const JacquardProject = ({
  docUrl,
  docHeads,
}: EditorProps<never, string>) => {
  const [latestDoc] = useDocument<JacquardBuildMetadata>(docUrl); // used to trigger re-rendering when jacquardTool
  const handle = useHandle<JacquardBuildMetadata>(docUrl);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const doc = useMemo(
    () => (docHeads ? A.view(latestDoc, docHeads) : latestDoc),
    [latestDoc, docHeads]
  );

  if (!doc) {
    return null;
  }

  return (
    <div className="h-full overflow-auto">
      {doc.buildRuns
        .slice()
        .reverse()
        .map((run, index) => (
          <li key={index} className="p-2">
            {run.outputs.map(({ path }) => path).join(",")} generated at{" "}
            {new Date(run.timestamp).toLocaleString()} by
            <pre>{run.command}</pre>
          </li>
        ))}
    </div>
  );
};

export const jacquardBuildMetadataTool: Tool = {
  type: "patchwork:tool",
  id: "jacquard-build-metadata",
  name: "Jacquard Build Metadata",
  supportedDataTypes: ["jacquard-build-metadata"],
  editorComponent: JacquardProject,
};

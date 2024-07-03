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
    <div className="h-full overflow-auto flex flex-col gap-4">
      {doc.buildRuns
        .slice()
        .reverse()
        .map((run, index) => (
          <div
            key={index}
            className="p-3 border-b border-gray-300 flex flex-col gap-1"
          >
            <div className="text-xs text-gray-500">
              {new Date(run.timestamp).toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <pre>{run.command}</pre>
            <div className="cursor-default">
              <div className="text-sm font-medium">Inputs:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {run.inputs.map(({ path }) => (
                  <div
                    key={path}
                    className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-full"
                  >
                    {path}
                  </div>
                ))}
              </div>
            </div>
            <div className="cursor-default">
              <div className="text-sm font-medium">Outputs:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {run.outputs.map(({ path }) => (
                  <div
                    key={path}
                    className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-full"
                  >
                    {path}
                  </div>
                ))}
              </div>
            </div>
          </div>
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

import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, Tool } from "@/tools";
import { next as A } from "@automerge/automerge";
import { useMemo, useState } from "react";
import { JacquardProjectDoc } from "./datatype";

export const JacquardProject = ({
  docUrl,
  docHeads,
}: EditorProps<never, string>) => {
  const [latestDoc] = useDocument<JacquardProjectDoc>(docUrl); // used to trigger re-rendering when jacquardTool
  const handle = useHandle<JacquardProjectDoc>(docUrl);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const doc = useMemo(
    () => (docHeads ? A.view(latestDoc, docHeads) : latestDoc),
    [latestDoc, docHeads]
  );

  if (!doc) {
    return null;
  }

  const fileContents = selectedFile ? doc.fileContents[selectedFile] : null;
  const buildRuns = selectedFile
    ? doc.buildRuns.filter((run) => run.outputs.includes(selectedFile))
    : [];

  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r border-gray-300 p-4">
        <div className="font-bold mb-2">Files:</div>
        <ul className="space-y-2">
          {Object.keys(doc.fileContents).map((fileName) => (
            <li
              key={fileName}
              className={`cursor-pointer p-2 ${
                selectedFile === fileName ? "bg-gray-200" : ""
              }`}
              onClick={() => setSelectedFile(fileName)}
            >
              {fileName}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-3/4 p-4 flex flex-col gap-4">
        {fileContents && (
          <div className="border border-gray-300 p-4">
            <div className="font-bold mb-2">File Contents:</div>
            {fileContents.contentType === "text/markdown" && (
              <pre>{String(fileContents.contents)}</pre>
            )}
          </div>
        )}
        {buildRuns.length > 0 && (
          <div className="border border-gray-300 p-4">
            <div className="font-bold mb-2">Build Runs:</div>
            <ul className="space-y-2">
              {buildRuns.map((run, index) => (
                <li key={index} className="p-2">
                  generated at {new Date(run.timestamp).toLocaleString()} by
                  <pre>{run.command}</pre>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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

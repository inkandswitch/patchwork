import * as Automerge from "@automerge/automerge";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { EditorProps } from "@/tools";
import { useMemo } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { JacquardBuildMetadata } from "../datatype";

export const LogView = ({
  docUrl,
  docHeads,
}: EditorProps<JacquardBuildMetadata, never>) => {
  const [latestDoc] = useDocument<JacquardBuildMetadata>(docUrl);

  const doc = useMemo(
    () =>
      latestDoc && docHeads ? Automerge.view(latestDoc, docHeads) : latestDoc,
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
            <pre>{run.spec.command}</pre>
            <div className="cursor-default">
              <div className="text-sm font-medium">Inputs:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {run.inputs.map(({ path, docUrl }) => (
                  <div
                    key={path}
                    className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-full cursor-pointer"
                    onClick={() =>
                      selectDocLink({ url: docUrl, type: "file", name: path })
                    }
                  >
                    {path}
                  </div>
                ))}
              </div>
            </div>
            <div className="cursor-default">
              <div className="text-sm font-medium">Outputs:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {run.outputs.map(({ path, docUrl }) => (
                  <div
                    key={path}
                    className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-full cursor-pointer"
                    onClick={() =>
                      selectDocLink({ url: docUrl, type: "file", name: path })
                    }
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

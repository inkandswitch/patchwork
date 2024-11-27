import * as Automerge from "@automerge/automerge";
import { selectDocLink } from "@/explorer/router";
import { EditorProps } from "@patchwork/sdk";
import { useMemo } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { BuildRunSpec, JacquardBuildMetadata } from "../datatype";
import { CopyButton } from "@patchwork/sdk/versionControl";
import { Trash2Icon } from "lucide-react";
import { Button } from "@patchwork/sdk/ui/button";

export const LogView = ({
  docUrl,
  docHeads,
}: EditorProps<JacquardBuildMetadata, never>) => {
  const [latestDoc, changeLatestDoc] =
    useDocument<JacquardBuildMetadata>(docUrl);

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
            key={run.timestamp}
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
            <details>
              <summary className="text-sm font-medium cursor-pointer">
                More info
              </summary>
              <div className="pl-6">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">CLI:</div>
                  <div className="text-xs font-mono">
                    {runSpecToCommand(run.spec)}
                  </div>
                  <CopyButton text={runSpecToCommand(run.spec)} size={16} />
                </div>
                {doc === latestDoc && (
                  <Button
                    variant="destructive"
                    className="flex gap-2 w-fit h-8 text-xs px-2"
                    onClick={() => {
                      changeLatestDoc((doc) => {
                        delete doc.buildRuns[index];
                      });
                    }}
                  >
                    <Trash2Icon size={14} /> Remove build run from log
                  </Button>
                )}
              </div>
            </details>
          </div>
        ))}
    </div>
  );
};

/** the opposite of buildRunSpecFromArgs, basically */
function runSpecToCommand(spec: BuildRunSpec): string {
  // TODO: poor escaping for shell
  // TODO: trouble to keep this in sync
  return [
    `jacquard run`,
    `--command "${spec.command}"`,
    spec.autoDeps.stdoutDeclared && "--stdoutDeclaredDeps",
    spec.autoDeps.latex && "--latexDeps",
    spec.explicitInputs.length > 0 &&
      `--inputs ${spec.explicitInputs.map((s) => `"${s}"`).join(" ")}`,
    spec.explicitOutputs.length > 0 &&
      `--outputs ${spec.explicitOutputs.map((s) => `"${s}"`).join(" ")}`,
    spec.name && `--name "${spec.name}"`,
  ]
    .filter(Boolean)
    .join(" ");
}

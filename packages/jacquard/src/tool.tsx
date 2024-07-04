import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { Tabs, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { EditorProps, Tool } from "@/tools";
import { next as A } from "@automerge/automerge";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { Graph } from "@visx/network";
import { useMemo, useState } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import { BuildRun, JacquardBuildMetadata } from "./datatype";

console.log(Graph);

export const JacquardBuildMetadataViewer = ({
  docUrl,
  docHeads,
}: EditorProps<JacquardBuildMetadata, never>) => {
  const [latestDoc] = useDocument<JacquardBuildMetadata>(docUrl); // used to trigger re-rendering when jacquardTool
  const handle = useHandle<JacquardBuildMetadata>(docUrl);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("graph");

  const doc = useMemo(
    () => (docHeads ? A.view(latestDoc, docHeads) : latestDoc),
    [latestDoc, docHeads]
  );

  if (!doc) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs
        defaultValue="log"
        value={selectedTab}
        className="w-full bg-gray-100 px-3 border-b border-gray-200"
        onValueChange={(value) => setSelectedTab(value)}
      >
        <TabsList className="grid w-fit grid-cols-2 flex">
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="overflow-auto flex-1 min-h-0">
        {selectedTab === "log" ? (
          <LogView buildRuns={doc.buildRuns} />
        ) : (
          <GraphView buildRuns={doc.buildRuns} />
        )}
      </div>
    </div>
  );
};

type BuildRunsViewProps = {
  buildRuns: BuildRun[];
};

const LogView = ({ buildRuns }: BuildRunsViewProps) => (
  <div className="h-full overflow-auto flex flex-col gap-4">
    {buildRuns
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

const GraphView = ({ buildRuns }: BuildRunsViewProps) => {
  return (
    <div className="w-full h-full">
      <ReactFlow nodes={[]} edges={[]} />
    </div>
  );
};

export const jacquardBuildMetadataTool: Tool = {
  type: "patchwork:tool",
  id: "jacquard-build-metadata",
  name: "Jacquard Build Metadata",
  supportedDataTypes: ["jacquard-build-metadata"],
  editorComponent: JacquardBuildMetadataViewer,
};

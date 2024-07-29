import { Om } from "@/om";
import { JacquardBuildMetadata } from "../datatype";
import { Button } from "@/shadcn/ui/button";
import { RefreshCw, CircleDashed, CheckCircle, Loader2 } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shadcn/ui/tooltip";
import {
  getProjectState,
  getStalenessInfo,
  ProjectState,
} from "../getStalenessInfo";

export const BuildRefreshButton = ({
  projectBuildMetadataOm,
  projectState,
}: {
  projectBuildMetadataOm: Om<JacquardBuildMetadata>;
  projectState?: ProjectState;
}) => {
  getProjectState;

  const { refreshState } = projectBuildMetadataOm.doc;

  const handleRefresh = () => {
    if (!projectBuildMetadataOm) {
      return;
    }

    projectBuildMetadataOm.handle.change((doc) => {
      doc.refreshState = { type: "requesting" };
    });
  };

  const buildsToRun = projectState
    ? Object.entries(getStalenessInfo(projectState).buildRunStatuses).flatMap(
        ([buildRunId, state]) => {
          if (state.length === 0) {
            return [];
          }
          const buildRun = projectBuildMetadataOm.doc.buildRuns.find(
            ({ id }) => buildRunId === id
          );

          return buildRun ? [buildRun] : [];
        }
      )
    : [];

  if (projectState && buildsToRun.length === 0) {
    return null;
  }

  const showTooltip = projectState || refreshState.type === "processing";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="outline"
            className="flex gap-2 w-fit"
            onClick={handleRefresh}
            disabled={projectBuildMetadataOm.doc.refreshState.type !== "idle"}
          >
            <RefreshCw
              size={16}
              className={
                projectBuildMetadataOm.doc.refreshState.type === "processing" ||
                projectBuildMetadataOm.doc.refreshState.type === "requesting"
                  ? "animate-spin"
                  : ""
              }
            />
            {projectBuildMetadataOm?.doc.refreshState.type === "requesting"
              ? "waiting"
              : projectBuildMetadataOm?.doc.refreshState.type === "processing"
              ? `processing`
              : ""}
          </Button>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent side="bottom">
            {refreshState.type === "processing" &&
              refreshState.buildRuns.map(({ command, progress }) => (
                <div className="flex gap-2 items-center">
                  <ProgressIcon state={progress} />
                  <div className="font-mono">{command}</div>
                </div>
              ))}

            {refreshState.type === "idle" && (
              <div className="flex flex-col gap-2">
                <div>Refresh will run the following comands</div>
                <div className="w-full border-t border-gray-300"></div>

                <div>
                  {buildsToRun.map((build) => (
                    <div className="flex gap-2 items-center">
                      <ProgressIcon state="waiting" />
                      <div className="font-mono">{build.command}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

const ProgressIcon = ({ state }: { state: "waiting" | "running" | "done" }) => {
  switch (state) {
    case "waiting":
      return <CircleDashed size={16} />;
    case "running":
      return <Loader2 className="animate-spin" size={16} />;
    case "done":
      return <CheckCircle size={16} />;
  }
};
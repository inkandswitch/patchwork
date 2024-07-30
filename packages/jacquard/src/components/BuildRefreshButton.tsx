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
  alignTooltip,
}: {
  projectBuildMetadataOm: Om<JacquardBuildMetadata>;
  projectState?: ProjectState;
  alignTooltip?: "start" | "end" | "center";
}) => {
  getProjectState;

  const { refreshState } = projectBuildMetadataOm.doc;

  const handleRefresh = () => {
    if (
      !projectBuildMetadataOm ||
      (refreshState && refreshState.type !== "idle")
    ) {
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="outline"
            className="flex gap-2 w-fit"
            onClick={handleRefresh}
          >
            <RefreshCw
              size={16}
              className={
                refreshState?.type === "processing" ||
                refreshState?.type === "requesting"
                  ? "animate-spin"
                  : ""
              }
            />
            {refreshState?.type === "requesting"
              ? "waiting"
              : refreshState?.type === "processing"
              ? `processing`
              : ""}
          </Button>
        </TooltipTrigger>

        <TooltipContent side="bottom" align={alignTooltip}>
          <div className="flex flex-col gap-2">
            <div>
              {refreshState.type === "idle"
                ? "The following commands need to rerun"
                : refreshState.type === "requesting"
                ? "Waiting for demon to start build"
                : "Demon is running the commands"}
            </div>
            <div className="w-full border-t border-gray-300"></div>

            {refreshState?.type === "processing" && (
              <div>
                {refreshState.buildRuns.map(({ command, progress }) => (
                  <div className="flex gap-2 items-center">
                    <ProgressIcon state={progress} />
                    <div className="font-mono">{command}</div>
                  </div>
                ))}
              </div>
            )}

            {(refreshState?.type === "idle" ||
              refreshState?.type === "requesting") && (
              <div>
                {buildsToRun.map((build) => (
                  <div className="flex gap-2 items-center">
                    <ProgressIcon state="waiting" />
                    <div className="font-mono">{build.command}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
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
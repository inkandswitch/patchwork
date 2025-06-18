import { Om } from "@patchwork/sdk/om";
import { Button } from "@patchwork/sdk/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@patchwork/sdk/ui";
import { canBeUndef } from "@patchwork/sdk/utils";
import { CheckCircle, CircleDashed, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { JacquardBuildMetadata, RefreshState } from "../datatype";
import { getStalenessInfo, ProjectState } from "../getStalenessInfo";

export const BuildRefreshButton = ({
  projectBuildMetadataOm,
  projectState,
  alignTooltip,
}: {
  projectBuildMetadataOm: Om<JacquardBuildMetadata>;
  projectState?: ProjectState;
  alignTooltip?: "start" | "end" | "center";
}) => {
  // TODO: not sure why this can be undefined but empirically it can be
  const refreshState: RefreshState = useMemo(
    () =>
      canBeUndef(projectBuildMetadataOm.doc.refreshState) || {
        type: "idle",
      },
    [projectBuildMetadataOm.doc.refreshState]
  );

  const handleRefresh = useCallback(() => {
    if (
      !projectBuildMetadataOm ||
      (refreshState && refreshState.type !== "idle")
    ) {
      return;
    }

    projectBuildMetadataOm.handle.change((doc) => {
      doc.refreshState = { type: "requesting" };
    });
  }, [projectBuildMetadataOm, refreshState]);

  useEffect(() => {
    const onKeydown = (evt: KeyboardEvent) => {
      const isMetaOrControlPressed = evt.ctrlKey || evt.metaKey;

      // TODO: collides with a shortcut in AnnotationGroupView
      if (evt.key === "Enter" && isMetaOrControlPressed) {
        handleRefresh();
        return;
      }
    };

    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [handleRefresh]);

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
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="flex gap-2 w-fit h-8 text-xs px-2"
            onClick={handleRefresh}
          >
            <RefreshCw
              size={14}
              className={
                refreshState.type === "processing" ||
                refreshState.type === "requesting"
                  ? "animate-spin"
                  : ""
              }
            />
            {refreshState.type === "idle" ? (
              "Rebuild"
            ) : refreshState.type === "requesting" ? (
              "Waiting"
            ) : (
              <ProcessingButtonLabel
                projectBuildMetadataOm={projectBuildMetadataOm}
                processorHeartbeat={refreshState.processorHeartbeat}
              />
            )}
          </Button>
        </TooltipTrigger>

        <TooltipContent side="bottom" align={alignTooltip}>
          <div className="flex flex-col gap-2">
            <div>
              {refreshState.type === "idle"
                ? "The following commands need to rerun:"
                : refreshState.type === "requesting"
                  ? "Waiting to start build"
                  : "Running commands"}
            </div>
            <div className="w-full border-t border-gray-300"></div>

            {refreshState?.type === "processing" && (
              <div>
                {refreshState.buildRunRefreshStates?.map(
                  ({ id, spec: { command, name }, progress, log }) => (
                    <div key={id} className="flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <ProgressIcon state={progress} />
                        <div className="font-mono">{name ?? command}</div>
                      </div>
                      {progress === "running" && (
                        <pre className="text-xs">
                          {log?.join("").split("\n").slice(-5).join("\n")}
                        </pre>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {(refreshState?.type === "idle" ||
              refreshState?.type === "requesting") && (
              <div>
                {buildsToRun.map(({ id, spec: { command } }) => (
                  <div key={id} className="flex gap-2 items-center">
                    <ProgressIcon state="waiting" />
                    <div className="font-mono">{command}</div>
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

const ProcessingButtonLabel = (props: {
  projectBuildMetadataOm: Om<JacquardBuildMetadata>;
  processorHeartbeat: number;
}) => {
  const { projectBuildMetadataOm, processorHeartbeat } = props;
  const [secsSinceHeartbeat, setSecsSinceHeartbeat] = useState<number>(0);
  useEffect(() => {
    void processorHeartbeat;
    const interval = setInterval(() => {
      setSecsSinceHeartbeat((secs) => secs + 1);
    }, 1000);

    return () => {
      setSecsSinceHeartbeat(0);
      clearInterval(interval);
    };
  }, [processorHeartbeat]);

  const PROCESSING_TIMEOUT_S = 30;

  useEffect(() => {
    // This is a very conservative check - sometimes the watcher freezes
    if (secsSinceHeartbeat >= PROCESSING_TIMEOUT_S) {
      projectBuildMetadataOm.handle.change((doc) => {
        doc.refreshState = { type: "requesting" };
      });
    }
  }, [projectBuildMetadataOm.handle, secsSinceHeartbeat]);

  if (secsSinceHeartbeat < 5) {
    return "Processing";
  } else {
    return `Processing (Lost connection... ${
      PROCESSING_TIMEOUT_S - secsSinceHeartbeat
    })`;
  }
};

export const DisabledBuildRefreshButton = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs w-fit"
            disabled={true}
          >
            <RefreshCw size={14} className="mr-1" />
            Rebuild
          </Button>
        </TooltipTrigger>

        <TooltipContent side="bottom">
          <div className="flex flex-col gap-2">
            <div>This document is already up to date.</div>
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

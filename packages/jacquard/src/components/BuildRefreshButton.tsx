import { Om } from "@/om";
import { JacquardBuildMetadata } from "../datatype";
import { Button } from "@/shadcn/ui/button";
import { RefreshCw } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shadcn/ui/tooltip";
import { getProjectState } from "../getStalenessInfo";

export const BuildRefreshButton = ({
  projectBuildMetadataOm,
}: {
  projectBuildMetadataOm: Om<JacquardBuildMetadata>;
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
                projectBuildMetadataOm?.doc.refreshState.type ===
                  "processing" ||
                projectBuildMetadataOm?.doc.refreshState.type === "requesting"
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
        <TooltipContent side="bottom">
          {refreshState.type === "processing" &&
            refreshState.buildRuns.map(({ command, progress }) => (
              <div>{command}</div>
            ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

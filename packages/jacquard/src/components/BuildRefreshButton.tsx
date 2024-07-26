import { Om } from "@/om";
import { JacquardBuildMetadata } from "../datatype";
import { Button } from "@/shadcn/ui/button";
import { RefreshCw } from "lucide-react";

export const BuildRefreshButton = ({
  projectBuildMetadataOm,
}: {
  projectBuildMetadataOm: Om<JacquardBuildMetadata>;
}) => {
  const handleRefresh = () => {
    if (!projectBuildMetadataOm) {
      return;
    }

    projectBuildMetadataOm.handle.change((doc) => {
      doc.refreshState = "requesting";
    });
  };

  return (
    <Button
      variant="outline"
      className="flex gap-2 w-fit"
      onClick={handleRefresh}
    >
      <RefreshCw
        size={16}
        className={
          projectBuildMetadataOm?.doc.refreshState === "processing" ||
          projectBuildMetadataOm?.doc.refreshState === "requesting"
            ? "animate-spin"
            : ""
        }
      />
      {projectBuildMetadataOm?.doc.refreshState === "requesting"
        ? "waiting"
        : projectBuildMetadataOm?.doc.refreshState === "processing"
        ? "processing"
        : ""}
    </Button>
  );
};

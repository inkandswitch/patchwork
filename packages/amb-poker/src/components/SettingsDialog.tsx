import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@patchwork/sdk/ui/dialog";
import { Button } from "@patchwork/sdk/ui/button";
import { Icon } from "@patchwork/sdk/ui/icons";
import { LinkedSheets } from "./LinkedSheets";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { Env } from "@patchwork/ambsheet";

interface SettingsDialogProps {
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheets: Record<AutomergeUrl, Env>;
  onChange: (sheets: { [key: string]: AutomergeUrl }) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  linkedSheets,
  evaluatedSheets,
  onChange,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Icon type="Settings" size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <h3 className="text-sm font-medium mb-2">Linked Sheets</h3>
          <LinkedSheets
            linkedSheets={linkedSheets}
            evaluatedSheets={evaluatedSheets}
            onChange={onChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

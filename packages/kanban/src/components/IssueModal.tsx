import { memo, useRef, useState } from "react";

import SelectLane from "./contextmenu/StatusMenu";

import { useCurrentAccount } from "@patchwork/sdk";
import { MarkdownInput } from "@/lib/markdown";
import { Button } from "@patchwork/sdk/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@patchwork/sdk/ui/dialog";
import { Input } from "@patchwork/sdk/ui/input";
import { Label } from "@patchwork/sdk/ui/label";
import { DocHandle } from "@automerge/automerge-repo";
import { Card, KanbanBoardDoc, Lane } from "../datatype";
import { Status } from "../types/issue";
import { showInfo } from "../utils/notification";
import { HasAssets } from "@patchwork/sdk/assets";
import { uuid } from "@automerge/automerge";

interface Props {
  docWithAssetsHandle: DocHandle<HasAssets>;
  isOpen: boolean;
  lanes: Lane[];
  onDismiss?: () => void;
  changeDoc: (fn: (doc: KanbanBoardDoc) => void) => void;
}

function IssueModal({
  isOpen,
  onDismiss,
  changeDoc,
  lanes,
  docWithAssetsHandle,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string>("");
  const [selectedLaneId, setSelectedLaneId] = useState(lanes[0]?.id);
  const account = useCurrentAccount();

  const handleSubmit = async () => {
    if (title === "") {
      alert("Please enter a title before submitting");
      return;
    }

    if (!account) {
      alert("Please login before submitting");
      return;
    }

    changeDoc((doc) => {
      const timestamp = Date.now();

      const cardId = uuid();

      doc.cards.push({
        id: cardId,
        title: title,
        createdByContactUrl: account.contactHandle.url,
        description: description ?? "",
        modifiedTimestamp: timestamp,
        createdTimestamp: timestamp,
      });

      const selectedLane = doc.lanes.find(({ id }) => id === selectedLaneId);
      if (selectedLane) {
        selectedLane.cardIds.unshift(cardId);
      }
    });

    if (onDismiss) onDismiss();
    reset();
    showInfo("You created new issue.", "Issue created");
  };

  const reset = () => {
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setSelectedLaneId(lanes[0]?.id);
    }, 250);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onDismiss && onDismiss();
        reset();
      }}
      modal={false}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Issue</DialogTitle>
        </DialogHeader>

        {/* Issue title */}

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="issueTitle">Title</Label>
          <Input
            id="issueTitle"
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Issue description editor */}

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label>Description</Label>
          <div className="border border-1 rounded-md p-2 border-gray-200 min-h-20">
            <MarkdownInput
              value={description}
              onChange={setDescription}
              docWithAssetsHandle={docWithAssetsHandle}
            />
          </div>
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="name">Status</Label>
          <SelectLane
            value={selectedLaneId}
            lanes={lanes}
            onSelect={setSelectedLaneId}
          />
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const IssueModalMemo = memo(IssueModal);
export default IssueModalMemo;

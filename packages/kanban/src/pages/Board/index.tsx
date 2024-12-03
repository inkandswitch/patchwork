import { Button } from "@patchwork/sdk/ui";
import { KanbanBoardDoc } from "../../datatype";
import IssueBoard from "./IssueBoard";
import { PlusIcon } from "lucide-react";

export type BoardProps = {
  doc: KanbanBoardDoc;
  changeDoc: (fn: (doc: KanbanBoardDoc) => void) => void;
  setOpenIssueId: (id: string | undefined) => void;
  setShowIssueModal: (show: boolean) => void;
};

function Board({
  doc,
  changeDoc,
  setOpenIssueId,
  setShowIssueModal,
}: BoardProps) {
  if (!doc) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      <div className="flex flex-shrink-0 border-b border-gray-200 p-2 pl-4 justify-start">
        <div className="flex gap-2 items-center">
          <span className="font-semibold">Board</span>
          <Button
            variant="ghost"
            onClick={() => setShowIssueModal(true)}
            size="sm"
            className="flex gap-2"
          >
            Create Issue
            <PlusIcon size={14} />
          </Button>
        </div>
      </div>
      <IssueBoard
        cards={doc.cards}
        lanes={doc.lanes}
        changeDoc={changeDoc}
        setOpenIssueId={setOpenIssueId}
      />
    </div>
  );
}

export default Board;

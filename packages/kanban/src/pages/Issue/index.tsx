import { ContactAvatar } from "@patchwork/sdk/components/ContactAvatar";
import { MarkdownEditor } from "@patchwork/sdk/markdown";
import { Button } from "@patchwork/sdk/ui";
import { next as A, Prop } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { TrashIcon, XIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import SelectLane from "../../components/contextmenu/StatusMenu";
import { KanbanBoardDoc } from "../../datatype";

type IssuePageProps = {
  doc: KanbanBoardDoc;
  handle: DocHandle<KanbanBoardDoc>;
  changeDoc: (fn: (doc: KanbanBoardDoc) => void) => void;
  id: string;
  setOpenIssueId: (id: string | undefined) => void;
};

function IssuePage({
  doc,
  handle,
  changeDoc,
  id,
  setOpenIssueId,
}: IssuePageProps) {
  if (!doc) {
    return;
  }

  const cardIndex = doc.cards.findIndex((issue) => issue.id === id);
  const card = doc.cards[cardIndex];
  const lane = doc.lanes.find(({ cardIds }) => cardIds.includes(card.id))!; // TODO: JAH strict fix

  // ensure description is not undefined, this can be the
  useEffect(() => {
    if (card.description === undefined) {
      changeDoc((doc) => {
        doc.cards[cardIndex].description = "";
      });
    }
  }, [card.description]);

  const path = useMemo<Prop[]>(
    () => ["cards", cardIndex, "description"],
    [cardIndex]
  );

  const handleLaneChange = (laneId: string) => {
    changeDoc((doc) => {
      const issueToChange = doc.cards.find((card) => card.id === id);
      if (!issueToChange) {
        return;
      }
      const sourceLane = doc.lanes.find(({ cardIds }) =>
        cardIds.includes(card.id)
      );
      if (!sourceLane) {
        return;
      }

      const destinationLane = doc.lanes.find(({ id }) => id === laneId);
      if (!destinationLane) {
        return;
      }

      const sourceIndex = sourceLane.cardIds.findIndex((id) => id === card.id);
      sourceLane.cardIds.splice(sourceIndex, 1);
      destinationLane.cardIds.unshift(issueToChange.id);

      issueToChange.modifiedTimestamp = Date.now();
    });
  };

  const handleTitleChange = (title: string) => {
    changeDoc((doc) => {
      const index = doc.cards.findIndex((issue) => issue.id === id);
      if (index !== -1) {
        A.updateText(doc, ["cards", index, "title"], title);
      }
    });
  };

  const handleClose = () => {
    setOpenIssueId(undefined);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this issue?")) {
      changeDoc((doc) => {
        const indexToDelete = doc.cards.findIndex((issue) => issue.id === id);
        if (indexToDelete !== -1) {
          delete doc.cards[indexToDelete];
        }
      });

      handleClose();
    }
  };

  if (card === undefined) {
    return <div className="p-8 w-full text-center">Issue not found</div>;
  }

  const shortId = () => {
    if (card.id.includes("-")) {
      return card.id.slice(card.id.length - 8);
    } else {
      return card.id;
    }
  };

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden h-full">
        <div className="flex justify-between flex-shrink-0 border-b border-gray-200 p-2 pl-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Issue</span>
            <span className="text-gray-500" title={card.id}>
              {shortId()}
            </span>
          </div>

          <div className="flex items-center">
            <Button variant="ghost" onClick={() => handleDelete()} size="sm">
              <TrashIcon size={14} />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleClose}>
              <XIcon size={14} />
            </Button>
          </div>
        </div>

        <div className="flex flex-1">
          <div className="flex flex-col flex-1 gap-2 p-2 pr-4">
            <input
              className="w-full px-3 py-1 text-lg font-semibold placeholder-gray-400 border-transparent bg-transparent rounded "
              placeholder="Issue title"
              value={card.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />

            <div className="flex-1 overflow-auto max-w-[750px]">
              <div className="border border-1 rounded-md p-2 border-gray-200 min-h-20">
                <MarkdownEditor path={path} handle={handle} />
              </div>
            </div>
            {/*<div className="border-t border-gray-200 mt-3 p-3">
              <h2 className="text-md mb-3">Comments</h2>
              <Comments issue={issue} />
            </div>*/}
          </div>
          <div className="flex flex-col gap-4 border-l border-gray-200 p-4 w-[300px]">
            <div className="flex items-center">
              <div className="w-[100px]">Created by</div>
              <div className="flex flex-[3_0_0]">
                <ContactAvatar
                  url={card.createdByContactUrl}
                  showName={true}
                  size="sm"
                />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-[100px]">Status</div>
              <div className="flex flex-[3_0_0]">
                <SelectLane
                  lanes={doc.lanes}
                  value={lane.id}
                  onSelect={handleLaneChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default IssuePage;

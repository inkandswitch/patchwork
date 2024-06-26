import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Card, KanbanBoardDoc, Lane } from "../../datatype";
import { Status, StatusDisplay } from "../../types/issue";
import IssueCol from "./IssueCol";

export type IssueBoardProps = {
  cards: Card[];
  lanes: Lane[];
  changeDoc: (fn: (doc: KanbanBoardDoc) => void) => void;
  setOpenIssueId: (id: string | undefined) => void;
};

export default function IssueBoard({
  cards,
  lanes,
  changeDoc,
  setOpenIssueId,
}: IssueBoardProps) {
  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (destination && destination.droppableId) {
      // Update the issue in the doc
      changeDoc((doc) => {
        const sourceLane = doc.lanes.find(
          ({ id }) => id === source.droppableId
        );
        const destinationLane = doc.lanes.find(
          ({ id }) => id === destination.droppableId
        );

        sourceLane.cardIds.splice(source.index, 1);
        destinationLane.cardIds.splice(destination.index, 0, draggableId);
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-1 pt-6 pl-8 w-full">
        {lanes.map((lane) => (
          <IssueCol
            key={lane.id}
            title={StatusDisplay[Status.BACKLOG]}
            lane={lane}
            cards={cards}
            setOpenIssueId={setOpenIssueId}
            changeDoc={changeDoc}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

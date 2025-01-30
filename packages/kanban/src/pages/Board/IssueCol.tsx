import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { memo, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, areEqual } from "react-window";
import { Card, KanbanBoardDoc, Lane } from "../../datatype";
import IssueItem, { itemHeight } from "./IssueItem";

interface Props {
  title: string;
  lane: Lane;
  cards: Card[];
  changeDoc: (fn: (doc: KanbanBoardDoc) => void) => void;
  setOpenIssueId: (id: string | undefined) => void;
}

const itemSpacing = 8;

function IssueCol({ lane, cards, changeDoc, setOpenIssueId }: Props) {
  const cardsOfLane = useMemo(
    () =>
      lane.cardIds.flatMap((cardId) => {
        const card = cards.find(({ id }) => id === cardId);
        return card ? [card] : [];
      }),
    [cards, lane.cardIds]
  );

  const Row = useMemo(
    () =>
      memo(
        ({
          data: cardsOfLane,
          index,
          style,
        }: {
          data: Card[];
          index: number;
          style?: React.CSSProperties;
        }) => {
          const card = cardsOfLane[index];

          if (!card) return null;
          return (
            <Draggable draggableId={card.id} index={index} key={card.id}>
              {(
                provided: DraggableProvided,
                snapshot: DraggableStateSnapshot
              ) => (
                <IssueItem
                  provided={provided}
                  card={card}
                  isDragging={snapshot.isDragging}
                  style={style}
                  setOpenIssueId={setOpenIssueId}
                />
              )}
            </Draggable>
          );
        },
        areEqual
      ),
    [setOpenIssueId, cardsOfLane]
  );

  return (
    <div className="flex flex-col shrink-0 mr-3 select-none w-[250px]">
      <div className="flex items-center justify-between pb-3 text-sm">
        <div className="flex items-center">
          <span className="ml-3 mr-3 font-medium">{lane.title} </span>
          <span className="mr-3 font-normal text-gray-400">
            {cardsOfLane?.length || 0}
          </span>
        </div>
      </div>
      <Droppable
        droppableId={lane.id}
        key={lane.id}
        type="category"
        mode="virtual"
        renderClone={(provided, snapshot, rubric) => {
          const card = cards.find(({ id }) => id === rubric.draggableId)!;  // TODO: JAH strict fix

          return (
            <IssueItem
              provided={provided}
              card={card}
              isDragging={snapshot.isDragging}
              setOpenIssueId={setOpenIssueId}
              style={provided.draggableProps.style}
            />
          );
        }}
      >
        {(
          droppableProvided: DroppableProvided,
          snapshot: DroppableStateSnapshot
        ) => {
          // Add an extra item to our list to make space for a dragging item
          // Usually the DroppableProvided.placeholder does this, but that won't
          // work in a virtual list
          const itemCount: number = snapshot.isUsingPlaceholder
            ? cardsOfLane.length + 1
            : cardsOfLane.length;

          return (
            <div className="grow">
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    // autosizer not dealing well with fractional sizes
                    // https://github.com/bvaughn/react-virtualized/issues/1287
                    height={height - 1}
                    itemCount={itemCount}
                    itemSize={itemHeight + itemSpacing}
                    width={width}
                    outerRef={droppableProvided.innerRef}
                    itemData={cardsOfLane}
                    className="w-full border-gray-200 pt-0.5"
                    // ref={provided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            </div>
          );
        }}
      </Droppable>
    </div>
  );
}

const IssueColMemo = memo(IssueCol);
export default IssueColMemo;

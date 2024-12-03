import { DraggableProvided } from "@hello-pangea/dnd";
import classNames from "classnames";
import { memo, type CSSProperties } from "react";
import { Card } from "../../datatype";
import { ContactAvatar } from "@patchwork/sdk/components";

interface IssueProps {
  card: Card;
  isDragging?: boolean;
  provided: DraggableProvided;
  style?: CSSProperties;
  setOpenIssueId: (id: string | undefined) => void;
}

export const itemHeight = 100;

function getStyle(
  provided: DraggableProvided,
  style?: CSSProperties
): CSSProperties {
  return {
    ...provided.draggableProps.style,
    ...(style || {}),
    height: `${itemHeight}px`,
  };
}

const IssueItem = ({
  card,
  style,
  isDragging,
  provided,
  setOpenIssueId,
}: IssueProps) => {
  return (
    <div
      ref={provided.innerRef}
      className={classNames(
        "cursor-default flex flex-col w-full px-4 py-3 mb-2 bg-white rounded focus:outline-none shadow border border-gray-200",
        {
          "shadow-modal": isDragging,
        }
      )}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={getStyle(provided, style)}
      onClick={() => {
        setOpenIssueId(card.id);
      }}
    >
      <div className="flex justify-between w-full cursor-default">
        <div className="flex flex-col">
          <span className="mt-1 text-sm font-medium text-gray-700 line-clamp-2 overflow-ellipsis">
            {card.title}
          </span>
        </div>
        <div className="flex-shrink-0">
          <ContactAvatar url={card.createdByContactUrl} size="sm" />
        </div>
      </div>
    </div>
  );
};

const IssueItemMemo = memo(IssueItem);

export default IssueItemMemo;

import React from "react";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { AmbEmbedDoc } from "../datatype";
import { Env } from "@patchwork/ambsheet";
import { FilteredResults } from "@patchwork/ambsheet/src/eval";
import { CellReferenceBlock } from "./CellReferenceBlock";
import { Button } from "@patchwork/sdk/ui/button";
import { Icon } from "@patchwork/sdk/ui/icons";
import { TextBlock } from "./TextBlock";

interface CellReferenceBlocksProps {
  handle: DocHandle<AmbEmbedDoc>;
  blocks: AmbEmbedDoc["blocks"];
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheetsByUrl: Record<AutomergeUrl, Env>;
  filteredResultsByUrl: Record<AutomergeUrl, FilteredResults>;
  onUpdateCellReferenceBlock: (
    index: number,
    sheetName: string,
    cellName: string,
    viewerName: string
  ) => void;
  onUpdateTextBlock: (index: number, content: string) => void;
  onAddBlock: (type: "cellReference" | "text", index: number) => void;
  onDeleteBlock: (index: number) => void;
  onSetFilterSelection: (
    sheetUrl: AutomergeUrl,
    cellPos: { row: number; col: number },
    selectedValues: any[] | null
  ) => void;
}

const AddBlockButtons = ({
  onAdd,
  index,
  className = "",
}: {
  onAdd: (type: "cellReference" | "text", index: number) => void;
  index: number;
  className?: string;
}) => (
  <div className={`h-2 group relative ${className}`}>
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAdd("cellReference", index)}
        className="h-6 px-2 py-0"
      >
        <Icon type="Table" size={14} />
        <span className="text-xs">Add Cell Block</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAdd("text", index)}
        className="h-6 px-2 py-0"
      >
        <Icon type="Type" size={14} />
        <span className="text-xs">Add Text Block</span>
      </Button>
    </div>
  </div>
);

export const CellReferenceBlocks: React.FC<CellReferenceBlocksProps> = ({
  handle,
  blocks,
  linkedSheets,
  evaluatedSheetsByUrl,
  filteredResultsByUrl,
  onUpdateCellReferenceBlock,
  onAddBlock,
  onDeleteBlock,
  onSetFilterSelection,
}) => {
  return (
    <div className="space-y-2">
      <AddBlockButtons onAdd={onAddBlock} index={0} />

      {blocks.map((block, index) => (
        <React.Fragment key={index}>
          {block.type === "cellReference" ? (
            <CellReferenceBlock
              block={block}
              index={index}
              linkedSheets={linkedSheets}
              evaluatedSheetsByUrl={evaluatedSheetsByUrl}
              filteredResultsByUrl={filteredResultsByUrl}
              onUpdateBlock={onUpdateCellReferenceBlock}
              onDeleteBlock={onDeleteBlock}
              onSetFilterSelection={onSetFilterSelection}
            />
          ) : (
            <TextBlock
              block={block}
              index={index}
              onDeleteBlock={onDeleteBlock}
              handle={handle}
              path={["blocks", index, "content"]}
            />
          )}
          <AddBlockButtons onAdd={onAddBlock} index={index + 1} />
        </React.Fragment>
      ))}
    </div>
  );
};

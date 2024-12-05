import React, { useState } from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { AmbEmbedDoc } from "../datatype";
import { Env } from "@patchwork/ambsheet";
import { FilteredResults } from "@patchwork/ambsheet/src/eval";
import { CellReferenceBlock } from "./CellReferenceBlock";
import { Button } from "@patchwork/sdk/ui/button";
import { Icon } from "@patchwork/sdk/ui/icons";

interface CellReferenceBlocksProps {
  blocks: AmbEmbedDoc["blocks"];
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheetsByUrl: Record<AutomergeUrl, Env>;
  filteredResultsByUrl: Record<AutomergeUrl, FilteredResults>;
  onUpdateBlock: (
    index: number,
    sheetName: string,
    cellName: string,
    viewerName: string
  ) => void;
  onAddBlock: (index: number) => void;
  onDeleteBlock: (index: number) => void;
  onSetFilterSelection: (
    sheetUrl: AutomergeUrl,
    cellPos: { row: number; col: number },
    selectedValues: any[] | null
  ) => void;
}

const AddBlockButton = ({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) => (
  <div className={`h-2 group relative ${className}`}>
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="h-6 px-2 py-0"
      >
        <Icon type="PlusCircle" size={14} />
        <span className="text-xs">Add Block</span>
      </Button>
    </div>
  </div>
);

export const CellReferenceBlocks: React.FC<CellReferenceBlocksProps> = ({
  blocks,
  linkedSheets,
  evaluatedSheetsByUrl,
  filteredResultsByUrl,
  onUpdateBlock,
  onAddBlock,
  onDeleteBlock,
  onSetFilterSelection,
}) => {
  return (
    <div className="space-y-2">
      <AddBlockButton onClick={() => onAddBlock(0)} />

      {blocks.map((block, index) => (
        <React.Fragment key={index}>
          <CellReferenceBlock
            block={block}
            index={index}
            linkedSheets={linkedSheets}
            evaluatedSheetsByUrl={evaluatedSheetsByUrl}
            filteredResultsByUrl={filteredResultsByUrl}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            onSetFilterSelection={onSetFilterSelection}
          />
          <AddBlockButton onClick={() => onAddBlock(index + 1)} />
        </React.Fragment>
      ))}
    </div>
  );
};

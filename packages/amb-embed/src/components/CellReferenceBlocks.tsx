import React from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { AmbEmbedDoc } from "../datatype";
import { Env } from "@patchwork/ambsheet";
import { FilteredResults } from "@patchwork/ambsheet/src/eval";
import { CellReferenceBlock } from "./CellReferenceBlock";

interface CellReferenceBlocksProps {
  blocks: AmbEmbedDoc["blocks"];
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheetsByUrl: Record<AutomergeUrl, Env>;
  filteredResultsByUrl: Record<AutomergeUrl, FilteredResults>;
  onUpdateBlock: (index: number, sheetName: string, cellName: string) => void;
}

export const CellReferenceBlocks: React.FC<CellReferenceBlocksProps> = ({
  blocks,
  linkedSheets,
  evaluatedSheetsByUrl,
  filteredResultsByUrl,
  onUpdateBlock,
}) => {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <CellReferenceBlock
          key={index}
          block={block}
          index={index}
          linkedSheets={linkedSheets}
          evaluatedSheetsByUrl={evaluatedSheetsByUrl}
          filteredResultsByUrl={filteredResultsByUrl}
          onUpdateBlock={onUpdateBlock}
        />
      ))}
    </div>
  );
};

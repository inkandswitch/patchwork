import React from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { AmbEmbedDoc } from "../datatype";

interface CellReferenceBlocksProps {
  blocks: AmbEmbedDoc["blocks"];
  linkedSheets: { [key: string]: AutomergeUrl };
  onUpdateBlock: (index: number, sheetName: string, cellName: string) => void;
}

export const CellReferenceBlocks: React.FC<CellReferenceBlocksProps> = ({
  blocks,
  linkedSheets,
  onUpdateBlock,
}) => {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={index}
          className="p-4 border rounded-lg bg-white shadow-sm space-y-2"
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sheet
              </label>
              <select
                value={block.sheetName}
                onChange={(e) =>
                  onUpdateBlock(index, e.target.value, block.cellName)
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a sheet...</option>
                {Object.keys(linkedSheets).map((sheetName) => (
                  <option key={sheetName} value={sheetName}>
                    {sheetName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cell Name
              </label>
              <input
                type="text"
                value={block.cellName}
                onChange={(e) =>
                  onUpdateBlock(index, block.sheetName, e.target.value)
                }
                placeholder="Enter cell name..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {block.sheetName && linkedSheets[block.sheetName] && (
              <div>Sheet URL: {linkedSheets[block.sheetName]}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

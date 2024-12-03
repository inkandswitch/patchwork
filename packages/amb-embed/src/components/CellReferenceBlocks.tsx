import React from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { AmbEmbedDoc } from "../datatype";
import { Env } from "@patchwork/ambsheet";
import { printRawValue } from "@patchwork/ambsheet";

interface CellReferenceBlocksProps {
  blocks: AmbEmbedDoc["blocks"];
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheets: Record<AutomergeUrl, Env>;
  onUpdateBlock: (index: number, sheetName: string, cellName: string) => void;
}

export const CellReferenceBlocks: React.FC<CellReferenceBlocksProps> = ({
  blocks,
  linkedSheets,
  evaluatedSheets,
  onUpdateBlock,
}) => {
  const getCellsForSheet = (sheetName: string) => {
    if (!sheetName || !linkedSheets[sheetName]) return [];

    const sheetUrl = linkedSheets[sheetName];
    const evaluatedSheet = evaluatedSheets[sheetUrl];
    if (!evaluatedSheet) return [];

    return Array.from(evaluatedSheet.cellPosByName.values())
      .map((cell) => cell.name)
      .sort();
  };

  const getCellValue = (sheetName: string, cellName: string) => {
    if (!sheetName || !cellName || !linkedSheets[sheetName]) return null;

    const sheetUrl = linkedSheets[sheetName];
    const evaluatedSheet = evaluatedSheets[sheetUrl];
    if (!evaluatedSheet) return null;

    // Look up the position using the cellName
    const cellPos = evaluatedSheet.cellPosByName.get(
      cellName.toLowerCase()
    )?.pos;
    if (!cellPos) return null;

    // Get the evaluated results at that position
    const results = evaluatedSheet.getCellValues(cellPos);
    return results;
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const cellResults = getCellValue(block.sheetName, block.cellName);

        return (
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
                  onChange={(e) => onUpdateBlock(index, e.target.value, "")}
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
                <select
                  value={block.cellName}
                  onChange={(e) =>
                    onUpdateBlock(index, block.sheetName, e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!block.sheetName}
                >
                  <option value="">Select a cell...</option>
                  {getCellsForSheet(block.sheetName).map((cellName) => (
                    <option key={cellName} value={cellName}>
                      {cellName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Display cell results */}
            {cellResults && Array.isArray(cellResults) && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Cell Values:
                </div>
                <div className="space-y-1">
                  {cellResults.map((result, i) => (
                    <div key={i} className="text-sm text-gray-600">
                      {printRawValue(result.rawValue)}
                      <span className="text-xs text-gray-400 ml-2">
                        (context:{" "}
                        {JSON.stringify(Object.fromEntries(result.context))})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              {block.sheetName && linkedSheets[block.sheetName] && (
                <div>Sheet URL: {linkedSheets[block.sheetName]}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

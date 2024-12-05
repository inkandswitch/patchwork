import React from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { Env, valueViewers } from "@patchwork/ambsheet";
import { FilteredResults } from "@patchwork/ambsheet/src/eval";
import { Button } from "@patchwork/sdk/ui/button";
import { Icon } from "@patchwork/sdk/ui/icons";

interface CellReferenceBlockProps {
  block: {
    sheetName: string;
    cellName: string;
    viewerName: string;
  };
  index: number;
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheetsByUrl: Record<AutomergeUrl, Env>;
  filteredResultsByUrl: Record<AutomergeUrl, FilteredResults>;
  onUpdateBlock: (
    index: number,
    sheetName: string,
    cellName: string,
    viewerName: string
  ) => void;
  onDeleteBlock: (index: number) => void;
  onSetFilterSelection: (
    sheetUrl: AutomergeUrl,
    cellPos: { row: number; col: number },
    selectedValues: any[] | null
  ) => void;
}

export const CellReferenceBlock: React.FC<CellReferenceBlockProps> = ({
  block,
  index,
  linkedSheets,
  evaluatedSheetsByUrl,
  filteredResultsByUrl,
  onUpdateBlock,
  onDeleteBlock,
  onSetFilterSelection,
}) => {
  const getCellsForSheet = (sheetName: string) => {
    if (!sheetName || !linkedSheets[sheetName]) return [];

    const sheetUrl = linkedSheets[sheetName];
    const evaluatedSheet = evaluatedSheetsByUrl[sheetUrl];
    if (!evaluatedSheet) return [];

    return Array.from(evaluatedSheet.cellPosByName.values())
      .map((cell) => cell.name)
      .sort();
  };

  const getCellValue = (sheetName: string, cellName: string) => {
    if (!sheetName || !cellName || !linkedSheets[sheetName]) return null;

    const sheetUrl = linkedSheets[sheetName];
    const evaluatedSheet = evaluatedSheetsByUrl[sheetUrl];
    if (!evaluatedSheet) return null;

    const cellPos = evaluatedSheet.cellPosByName.get(
      cellName.toLowerCase()
    )?.pos;
    if (!cellPos) return null;

    const results = filteredResultsByUrl[sheetUrl][cellPos.row][cellPos.col];
    return results;
  };

  const cellResults = getCellValue(block.sheetName, block.cellName);
  const sheet = evaluatedSheetsByUrl[linkedSheets[block.sheetName]];
  const viewer = valueViewers.find((v) => v.name === block.viewerName);
  const cellIsReady = cellResults !== null && Array.isArray(cellResults);

  const cellPos = sheet?.cellPosByName.get(block.cellName);
  const selectedCells = cellPos ? [cellPos.pos] : [];

  const handleSetFilterSelection = (selectedValues: any[] | null) => {
    if (!block.sheetName || !block.cellName) return;

    const sheetUrl = linkedSheets[block.sheetName];
    const sheet = evaluatedSheetsByUrl[sheetUrl];
    if (!sheet) return;

    const cellPos = sheet.cellPosByName.get(block.cellName.toLowerCase())?.pos;
    if (!cellPos) return;

    onSetFilterSelection(sheetUrl, cellPos, selectedValues);
  };

  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm space-y-2 group">
      <div className="flex items-center gap-3 text-xs">
        <div className="flex-1 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-gray-500 whitespace-nowrap">Sheet:</label>
            <select
              value={block.sheetName}
              onChange={(e) =>
                onUpdateBlock(index, e.target.value, "", block.viewerName)
              }
              className="px-2 py-1 border rounded"
            >
              <option value="">Select...</option>
              {Object.keys(linkedSheets).map((sheetName) => (
                <option key={sheetName} value={sheetName}>
                  {sheetName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-500 whitespace-nowrap">Cell:</label>
            <select
              value={block.cellName}
              onChange={(e) =>
                onUpdateBlock(
                  index,
                  block.sheetName,
                  e.target.value,
                  block.viewerName
                )
              }
              className="px-2 py-1 border rounded"
              disabled={!block.sheetName}
            >
              <option value="">Select...</option>
              {getCellsForSheet(block.sheetName).map((cellName) => (
                <option key={cellName} value={cellName}>
                  {cellName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-500 whitespace-nowrap">View as:</label>
            <select
              value={block.viewerName}
              onChange={(e) =>
                onUpdateBlock(
                  index,
                  block.sheetName,
                  block.cellName,
                  e.target.value
                )
              }
              className="px-2 py-1 border rounded"
            >
              <option value="">Select...</option>
              {valueViewers.map((viewer) => (
                <option
                  key={viewer.name}
                  value={viewer.name}
                  disabled={
                    !cellIsReady ||
                    viewer.shouldRender(cellResults, sheet) === "hide"
                  }
                >
                  {viewer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteBlock(index)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
        >
          <Icon type="Trash" size={14} />
        </Button>
      </div>

      {cellIsReady && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          {viewer && (
            <viewer.component
              sheet={evaluatedSheetsByUrl[linkedSheets[block.sheetName]]}
              values={cellResults}
              selectedCells={selectedCells}
              setFilterSelection={handleSetFilterSelection}
            />
          )}
          {!viewer && (
            <div className="text-red-500">
              Unknown viewer: {block.viewerName ?? "undefined"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

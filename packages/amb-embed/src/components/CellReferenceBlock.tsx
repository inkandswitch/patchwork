import React from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { Env, valueViewers } from "@patchwork/ambsheet";
import { FilteredResults } from "@patchwork/ambsheet/src/eval";

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
}

export const CellReferenceBlock: React.FC<CellReferenceBlockProps> = ({
  block,
  index,
  linkedSheets,
  evaluatedSheetsByUrl,
  filteredResultsByUrl,
  onUpdateBlock,
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

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-2">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sheet
          </label>
          <select
            value={block.sheetName}
            onChange={(e) =>
              onUpdateBlock(index, e.target.value, "", block.viewerName)
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
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Viewer
          </label>
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
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a viewer...</option>
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

      {cellIsReady && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          {viewer && (
            <viewer.component
              sheet={evaluatedSheetsByUrl[linkedSheets[block.sheetName]]}
              values={cellResults}
              selectedCells={[]}
              setFilterSelection={() => {}}
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

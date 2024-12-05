import {
  useDocument,
  useDocuments,
  useHandle,
} from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { AmbEmbedDoc } from "./datatype";
import React, { useMemo } from "react";
import { LinkedSheets } from "./components/LinkedSheets";
import {
  AmbSheetDoc,
  Env,
  evalSheet,
  Filter,
  filter2,
  FilteredResults,
} from "@patchwork/ambsheet";
import {
  AutomergeUrl,
  DocumentId,
  updateText,
} from "@automerge/automerge-repo";
import { CellReferenceBlocks } from "./components/CellReferenceBlocks";
import { Button } from "@patchwork/sdk/ui/button";

export const AmbEmbed: React.FC<EditorProps<AmbEmbedDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument<AmbEmbedDoc>(docUrl);
  const docHandle = useHandle(docUrl);
  const linkedSheets = useDocuments<AmbSheetDoc>(
    Object.values(doc?.linkedSheets || {})
  );

  const evaluatedLinkedSheets = useMemo(() => {
    return Object.entries(linkedSheets).reduce((acc, [id, doc]) => {
      acc[`automerge:${id}` as AutomergeUrl] = evalSheet(doc.data);
      return acc;
    }, {} as Record<AutomergeUrl, Env>);
  }, [linkedSheets]);

  const filteredLinkedSheets = useMemo(() => {
    return Object.entries(evaluatedLinkedSheets).reduce((acc, [url, env]) => {
      const filteredResults = filter2(
        env.results,
        doc?.selectedFilters[url] || []
      );
      acc[url as AutomergeUrl] = filteredResults;
      return acc;
    }, {} as Record<AutomergeUrl, FilteredResults>);
  }, [evaluatedLinkedSheets, doc?.selectedFilters]);

  const handleSetFilterSelection = (
    sheetUrl: AutomergeUrl,
    cellPos: { row: number; col: number },
    selectedValues: any[] | null
  ) => {
    changeDoc((d) => {
      if (!d.selectedFilters) {
        d.selectedFilters = {};
      }

      if (!selectedValues) {
        // Clear filters for this sheet
        if (d.selectedFilters[sheetUrl]) {
          const filterIndex = d.selectedFilters[sheetUrl].findIndex(
            (f) => f.pos.row === cellPos.row && f.pos.col === cellPos.col
          );
          if (filterIndex !== -1) {
            d.selectedFilters[sheetUrl].splice(filterIndex, 1);
          }
        }
      } else {
        // Add or update filter
        const filter = {
          pos: cellPos,
          values: selectedValues,
        };

        if (!d.selectedFilters[sheetUrl]) {
          d.selectedFilters[sheetUrl] = [];
        }

        // Remove any existing filter for this position
        const filterIndex = d.selectedFilters[sheetUrl].findIndex(
          (f) => f.pos.row === cellPos.row && f.pos.col === cellPos.col
        );
        if (filterIndex !== -1) {
          d.selectedFilters[sheetUrl].splice(filterIndex, 1);
        }

        // Add the new filter
        d.selectedFilters[sheetUrl].push(filter);
      }
    });
  };

  if (!doc) {
    return null;
  }

  const handleLinkedSheetsChange = (newSheets: typeof doc.linkedSheets) => {
    changeDoc((d) => {
      d.linkedSheets = newSheets;
    });
  };

  const handleAddBlock = (type: "cellReference" | "text", index: number) => {
    changeDoc((d) => {
      switch (type) {
        case "text":
          d.blocks.splice(index, 0, {
            type: "text",
            content: "Hello world",
          });
          break;
        case "cellReference":
          d.blocks.splice(index, 0, {
            type: "cellReference",
            sheetName: Object.keys(doc.linkedSheets)[0] || "",
            cellName: "",
            viewerName: "Stacks",
          });
          break;
      }
    });
  };

  const handleUpdateCellReferenceBlock = (
    index: number,
    sheetName: string,
    cellName: string,
    viewerName: string
  ) => {
    changeDoc((d) => {
      const block = d.blocks[index];
      if (block.type !== "cellReference") {
        return;
      }

      block.sheetName = sheetName;
      block.cellName = cellName;
      block.viewerName = viewerName;
    });
  };

  const handleDeleteBlock = (index: number) => {
    changeDoc((d) => {
      const blockToDelete = d.blocks[index];

      // First remove the block
      d.blocks.splice(index, 1);

      if (blockToDelete.type !== "cellReference") {
        return;
      }

      // If we have filters and the block had a valid sheet and cell
      if (
        d.selectedFilters &&
        blockToDelete.sheetName &&
        blockToDelete.cellName
      ) {
        const sheetUrl = d.linkedSheets[blockToDelete.sheetName];
        if (!sheetUrl) return;

        // Get the cell position for the deleted block
        const sheet = evaluatedLinkedSheets[sheetUrl];
        if (!sheet) return;

        const cellPos = sheet.cellPosByName.get(
          blockToDelete.cellName.toLowerCase()
        )?.pos;
        if (!cellPos) return;

        // Check if any remaining blocks reference this same cell
        const hasOtherReferences = d.blocks.some(
          (block) =>
            block.type === "cellReference" &&
            block.sheetName === blockToDelete.sheetName &&
            block.cellName.toLowerCase() ===
              blockToDelete.cellName.toLowerCase()
        );

        // If no other blocks reference this cell, remove its filters
        if (!hasOtherReferences && d.selectedFilters[sheetUrl]) {
          const filterIndex = d.selectedFilters[sheetUrl].findIndex(
            (filter) =>
              filter.pos.row === cellPos.row && filter.pos.col === cellPos.col
          );
          if (filterIndex !== -1) {
            d.selectedFilters[sheetUrl].splice(filterIndex, 1);
          }

          // If this sheet has no more filters, remove the sheet entry
          if (d.selectedFilters[sheetUrl].length === 0) {
            delete d.selectedFilters[sheetUrl];
          }
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <LinkedSheets
        linkedSheets={doc.linkedSheets}
        evaluatedSheets={evaluatedLinkedSheets}
        onChange={handleLinkedSheetsChange}
      />
      <div className="flex-1 p-4">
        <CellReferenceBlocks
          handle={docHandle}
          blocks={doc.blocks}
          linkedSheets={doc.linkedSheets}
          evaluatedSheetsByUrl={evaluatedLinkedSheets}
          filteredResultsByUrl={filteredLinkedSheets}
          onUpdateCellReferenceBlock={handleUpdateCellReferenceBlock}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
          onSetFilterSelection={handleSetFilterSelection}
        />
      </div>
    </div>
  );
};

export const tool = makeTool({
  type: "patchwork:tool",
  id: "ambEmbed",
  name: "Amb Embed",
  supportedDataTypes: ["ambEmbed"],
  EditorComponent: AmbEmbed,
});

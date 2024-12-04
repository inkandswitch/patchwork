import { DocHandle } from "@automerge/automerge-repo";
import { useEffect, useMemo, useState } from "react";
import { AmbSheetDoc, Position, RawValue } from "../datatype";
import { NOT_READY, Value, FilteredResults, Env, FilteredValue } from "../eval";
import { displayNameForCell, printRawValue } from "../print";
import { Stacks } from "./Stacks";
import { TableViewer } from "./TableViewer";
import { FilterSelection } from "./AmbSheet";
import { histogramViewer, ResultHistogram } from "./ResultHistogram";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { choiceDependenciesViewer } from "./ChoiceDependencies";

type ShouldRenderPriority = "high" | "normal" | "hide";

export type ValueViewerProps = {
  sheet: Env;
  values: FilteredValue[];
  selectedCells?: Position[];
  setFilterSelection: (selectedValues: RawValue[] | null) => void;
};
export type ValueViewer = {
  name: string;
  shouldRender: (values: FilteredValue[]) => ShouldRenderPriority;
  component: React.FC<ValueViewerProps>;
};

const valueViewers: ValueViewer[] = [choiceDependenciesViewer, histogramViewer];

export const CellDetails = ({
  handle,
  selectedCell,
  filterSelection,
  setFilterSelectionForCell,
  filteredResults,
  sheet,
}: {
  handle: DocHandle<AmbSheetDoc>;
  selectedCell: Position;
  filterSelection: FilterSelection[];
  setFilterSelectionForCell: (
    cell: Position,
    selection: number[] | null
  ) => void;
  filteredResults: FilteredResults;
  sheet: Env;
}) => {
  const [doc] = useDocument<AmbSheetDoc>(handle.url);
  const filterSelectionForSelectedCell = useMemo(() => {
    return filterSelection.find(
      (f) => f.row === selectedCell.row && f.col === selectedCell.col
    );
  }, [filterSelection, selectedCell]);

  const selectedCellResult = useMemo(() => {
    const cellResults = filteredResults[selectedCell.row][selectedCell.col];
    if (cellResults === null || cellResults === NOT_READY) {
      return undefined;
    }
    return cellResults as { value: Value; include: boolean }[];
  }, [selectedCell, filteredResults]);

  const [cellContent, setCellContent] = useState<string>(
    doc?.data[selectedCell.row][selectedCell.col]
  );

  useEffect(() => {
    setCellContent(doc?.data[selectedCell.row][selectedCell.col]);
  }, [selectedCell, doc?.data]);

  const onSubmitContent = (e) =>
    handle.change((d) => {
      d.data[selectedCell.row][selectedCell.col] = e.target.value;
    });

  // These days, we like having filter selections as values, and ValueViewers indeed work that way.
  // But in other parts of the system, we still use indexes for filters (for now).
  // So, here we convert from one to the other.
  const setFilterSelectionForValueViewer = (
    selectedValues: RawValue[] | null
  ) => {
    let indexesToSelect = [];
    if (selectedValues && selectedCellResult) {
      for (let i = 0; i < selectedCellResult.length; i++) {
        if (selectedValues.includes(selectedCellResult[i].value.rawValue)) {
          indexesToSelect.push(i);
        }
      }
      console.log({ selectedValues, indexesToSelect });
      setFilterSelectionForCell(selectedCell, indexesToSelect);
    } else {
      setFilterSelectionForCell(selectedCell, null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="">
        <div className="text-xs text-gray-600 font-bold">
          {selectedCell && displayNameForCell(selectedCell, sheet)}
        </div>
        <input
          type="text"
          id="cellContent"
          name="cellContent"
          value={cellContent}
          onChange={(e) => setCellContent(e.target.value)}
          onBlur={onSubmitContent}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
              onSubmitContent(e);
            }
          }}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-2 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {selectedCellResult !== undefined &&
        valueViewers
          .filter(
            (viewer) => viewer.shouldRender(selectedCellResult) !== "hide"
          )
          .map((viewer) => (
            <div className="border-b border-gray-300 pb-3">
              <h2 className="text-xs text-gray-500 font-medium uppercase mb-2">
                {viewer.name}
              </h2>
              <viewer.component
                sheet={sheet}
                values={selectedCellResult}
                selectedCells={[selectedCell]}
                setFilterSelection={setFilterSelectionForValueViewer}
              />
            </div>
          ))}

      {selectedCellResult && selectedCellResult !== NOT_READY && (
        <div className="border-b border-gray-300 pb-3">
          <h2 className="text-xs text-gray-500 font-medium uppercase">Table</h2>
          <TableViewer
            sheet={sheet}
            selectedCell={selectedCell}
            results={selectedCellResult}
            filterSelection={filterSelectionForSelectedCell}
            setFilterSelectionForCell={setFilterSelectionForCell}
            filteredResults={filteredResults}
          />
        </div>
      )}
      {selectedCellResult && selectedCellResult !== NOT_READY && (
        <div className="border-b border-gray-300 pb-3">
          <h2 className="text-xs text-gray-500 font-medium uppercase mb-3">
            Stacks
          </h2>
          <Stacks
            selectedCell={selectedCell}
            results={selectedCellResult}
            filterSelection={filterSelectionForSelectedCell}
            setFilterSelectionForCell={setFilterSelectionForCell}
          />
        </div>
      )}
    </div>
  );
};

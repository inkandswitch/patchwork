import { Position } from "../datatype";
import { Env, FilteredValue, NOT_READY, Value } from "../eval";
import { displayNameForCell } from "../print";
import { ValueViewer, ValueViewerProps } from ".";

const ChoiceDependencies = ({
  sheet,
  values,
  selectedCells,
}: ValueViewerProps) => {
  const ambDependencies = sheet
    .getAmbDimensions(values.map((v) => v.value))
    .filter(
      // hide amb dimensions that are within the cell selection
      (dim) =>
        !selectedCells ||
        selectedCells.every(
          (c) => c.row !== dim.pos.row || c.col !== dim.pos.col
        )
    );

  return (
    <div className="text-xs text-gray-500">
      <div>This result depends on choices made in:</div>
      <ul>
        {ambDependencies.map((dim) => (
          <li key={displayNameForCell(dim.pos)} className="list-disc ml-4">
            {displayNameForCell(dim.pos, sheet)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const choiceDependenciesViewer: ValueViewer = {
  name: "Choice Dependencies",
  shouldRender: (values) =>
    values.some((v) => v.value.context.size > 0) ? "normal" : "hide",
  component: ChoiceDependencies,
};

import { Position } from "../datatype";
import { Env, NOT_READY, Value } from "../eval";
import { displayNameForCell } from "../print";

interface ChoiceDependenciesProps {
  sheet: Env;
  selectedCell: Position;
  selectedCellResult: { value: Value; include: boolean }[] | undefined;
}

export const ChoiceDependencies = ({
  sheet,
  selectedCell,
  selectedCellResult,
}: ChoiceDependenciesProps) => {
  const ambDependencies = sheet
    .getCellAmbDimensions(selectedCell)
    .filter(
      (dim) =>
        dim.pos.row !== selectedCell.row || dim.pos.col !== selectedCell.col
    );

  if (
    ambDependencies.length === 0 ||
    !selectedCellResult ||
    selectedCellResult === NOT_READY
  ) {
    return null;
  }

  return (
    <div>
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

import React, { useMemo } from "react";
import { FilteredResultsForCell, Value } from "../eval";
import { FilterSelection } from "./AmbSheet";
import { ValueViewer, ValueViewerProps } from "./CellDetails";

// TODO: add filterSelection... to props
export const Color = ({ values }: ValueViewerProps) => {
  const rawValues = values.map((v) => v.value.rawValue) as number[];
  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {rawValues.map((value, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: `rgba(0, 0, 255, ${(value - min) / (max - min)})`,
          }}
          className={`w-4 h-4 relative cursor-default border border-gray-200`}
        ></div>
      ))}
    </div>
  );
};

export const colorViewer: ValueViewer = {
  name: "Color",
  // todo: could refine this more: a small number of tall stacks with short names
  shouldRender: (values) =>
    values.every((value) => typeof value.value.rawValue === "number")
      ? "high"
      : "hide",
  component: Color,
};

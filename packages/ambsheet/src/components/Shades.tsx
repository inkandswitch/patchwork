import React from "react";
import { ValueViewer, ValueViewerProps } from "./CellDetails";

// TODO: add filterSelection... to props
export const Shades = ({ values, setFilterSelection }: ValueViewerProps) => {
  const rawValues = values.map((v) => v.value.rawValue) as number[];
  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {values.map((value, idx) => {
        const rawValue = value.value.rawValue as number;
        return (
          <div
            onMouseEnter={() => setFilterSelection([rawValue])}
            onMouseLeave={() => setFilterSelection(null)}
            key={idx}
            style={{
              backgroundColor: `rgba(0, 0, 255, ${
                (rawValue - min) / (max - min)
              })`,
            }}
            className={`w-4 h-4 relative cursor-default border ${
              value.include ? "border-gray-600" : "border-gray-200"
            }`}
          ></div>
        );
      })}
    </div>
  );
};

export const shadesViewer: ValueViewer = {
  name: "Shades",
  // todo: could refine this more: a small number of tall stacks with short names
  shouldRender: (values) =>
    values.length > 1 &&
    values.every((value) => typeof value.value.rawValue === "number")
      ? "high"
      : "hide",
  component: Shades,
};

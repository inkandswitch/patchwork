import React, { useMemo } from "react";
import { FilteredResultsForCell, Value } from "../eval";
import { groupBy, uniq } from "lodash";
import { FilterSelection } from "./AmbSheet";
import { Position, RawValue } from "../datatype";
import { ValueViewer, ValueViewerProps } from "./CellDetails";

export const Stacks = ({ values, setFilterSelection }: ValueViewerProps) => {
  const groupedValues = useMemo(() => {
    return groupBy(
      values.map((v, i) => ({ ...v, indexInCell: i })),
      (value) => renderValue(value.value.rawValue)
    );
  }, [values]);

  const selectGroup = (groupValue: any) => {
    const group = groupedValues[groupValue];
    if (!group) return;
    setFilterSelection(group.map((v) => v.value.rawValue));
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(groupedValues).map(([key, values]) => {
        const stackSize = Math.min(values.length, 4);
        const selected = values.every((v) => v.include);
        return (
          <div
            key={key}
            className={`w-10 relative cursor-default ${
              values.length > 1 ? "h-10" : "h-8"
            }`}
            onMouseEnter={() => selectGroup(key)}
            onMouseLeave={() => setFilterSelection(null)}
          >
            <div className="h-7">
              {Array.from({ length: stackSize }, (_, index) => {
                const greyedOut = values.every((v) => !v.include);
                return (
                  <div
                    key={index}
                    className={`absolute shadow-sm px-3 rounded-md border border-gray-200 ${
                      selected ? "bg-blue-100" : "bg-white"
                    } ${greyedOut ? "text-gray-300" : ""}`}
                    style={{
                      transform: `translate(${index * 2}px, -${index * 2}px)`,
                    }}
                  >
                    {key}
                  </div>
                );
              })}
            </div>

            {values.length > 1 && (
              <div className="text-xs text-gray-400 text-center">
                x{values.length}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const stacksViewer: ValueViewer = {
  name: "Stacks",
  // todo: could refine this more: a small number of tall stacks with short names
  shouldRender: (values) =>
    uniq(values.map((v) => v.value.rawValue)).length > 5 ? "hide" : "high",
  component: Stacks,
};

function renderValue(v: RawValue) {
  return typeof v === "number" ? v.toFixed(3) : "" + v;
}

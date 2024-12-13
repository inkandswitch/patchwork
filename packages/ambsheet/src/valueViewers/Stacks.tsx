import React, { useMemo, useState } from "react";
import { groupBy, uniq } from "lodash";
import { ValueViewer, ValueViewerProps } from ".";
import { FilteredValue } from "../eval";

export const Stacks = ({ values, setFilterSelection }: ValueViewerProps) => {
  const [pinnedFilter, setPinnedFilter] = useState<string | null>(null);

  const groupedValues = useMemo(() => {
    return groupBy(
      values.map((v, i) => ({ ...v, indexInCell: i })),
      renderValue
    );
  }, [values]);

  const selectGroup = (groupValue: any) => {
    const group = groupedValues[groupValue];
    if (!group) return;
    setFilterSelection(group.map((v) => v.value.rawValue));
  };

  const handleClick = (groupValue: string) => {
    if (pinnedFilter === groupValue) {
      // If clicking the already pinned group, unpin it
      setPinnedFilter(null);
      setFilterSelection(null);
    } else {
      // Pin the new group
      setPinnedFilter(groupValue);
      selectGroup(groupValue);
    }
  };

  const handleMouseEnter = (groupValue: string) => {
    // Only show hover state if no pin is active
    if (!pinnedFilter) {
      selectGroup(groupValue);
    }
  };

  const handleMouseLeave = () => {
    // Only clear hover state if no pin is active
    if (!pinnedFilter) {
      setFilterSelection(null);
    }
  };

  const clearFilter = () => {
    setPinnedFilter(null);
    setFilterSelection(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {Object.entries(groupedValues).map(([key, values]) => {
          const stackSize = Math.min(values.length, 4);
          const selected = values.every((v) => v.include);
          const isPinned = pinnedFilter === key;

          return (
            <div
              key={key}
              className={`w-10 relative cursor-pointer ${
                values.length > 1 ? "h-10" : "h-8"
              }`}
              onClick={() => handleClick(key)}
              onMouseEnter={() => handleMouseEnter(key)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="h-7">
                {Array.from({ length: stackSize }, (_, index) => {
                  const greyedOut = values.every((v) => !v.include);
                  return (
                    <div
                      key={index}
                      className={`absolute shadow-sm px-3 rounded-md border
                        ${isPinned ? "border-blue-400" : "border-gray-200"}
                        ${selected ? "bg-blue-100" : "bg-white"}
                        ${greyedOut ? "text-gray-300" : ""}`}
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

      {pinnedFilter && (
        <button
          onClick={clearFilter}
          className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <span>Clear filter</span>
        </button>
      )}
    </div>
  );
};

export const stacksViewer: ValueViewer = {
  name: "Stacks",
  shouldRender(values) {
    const n = uniq(values.map((v) => v)).length;
    return 1 < n && n <= 5 && values.every((v) => renderValue(v).length <= 15)
      ? "high"
      : "hide";
  },
  component: Stacks,
};

function renderValue(fv: FilteredValue) {
  const v = fv.value.rawValue;

  if (typeof v !== "number") {
    return "" + v;
  }

  let rv = v.toFixed(2);
  while (rv.at(-1) === "0") {
    rv = rv.slice(0, -1);
  }
  if (rv.at(-1) === ".") {
    rv = rv.slice(0, -1);
  }
  return rv;
}

import { ValueViewer } from ".";
import React from "react";
import { aggregateValues } from "./aggregate";

const displayPercentage = (percentage: number) =>
  percentage === 0
    ? "--"
    : percentage >= 10
    ? `${Math.round(percentage)}%`
    : `${percentage.toFixed(1)}%`;

export const tableViewer: ValueViewer = {
  name: "Table",
  shouldRender: (values) => {
    if (values.length < 2) return "hide";
    const groupedByKeys = aggregateValues(values.map((v) => v.value));
    if (!groupedByKeys.some((g) => g.groups.length > 1)) return "hide";
    return "normal";
  },
  component: ({ values }) => {
    const hasFilter = values.some((v) => !v.include);
    const filteredValues = values.filter((v) => v.include);

    const groupedByKeys = aggregateValues(values.map((v) => v.value));
    const filteredGroupedByKeys =
      hasFilter && filteredValues.length > 0
        ? aggregateValues(filteredValues.map((v) => v.value))
        : null;

    return (
      <div className="flex flex-col gap-4 bg-black bg-opacity-30 rounded-lg">
        {groupedByKeys.map((group, i) => (
          <div key={group.key} className="w-full">
            {groupedByKeys.length > 1 && (
              <div className="font-medium mb-2">{group.key}</div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Value</th>
                  <th className="text-right p-2">Overall</th>
                  {hasFilter && (
                    <th className="text-right p-2 text-blue-300">Filtered</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {group.groups.map((row) => {
                  const rawPercentage = (row.count / values.length) * 100;
                  const percentage = displayPercentage(rawPercentage);

                  const filteredGroup = filteredGroupedByKeys?.[i]?.groups.find(
                    (g) => g.name === row.name
                  );
                  const rawFilteredPercentage = filteredGroup
                    ? (filteredGroup.count / filteredValues.length) * 100
                    : 0;
                  const filteredPercentage = displayPercentage(
                    rawFilteredPercentage
                  );

                  return (
                    <tr key={row.name} className="border-t">
                      <td className="p-2">{row.name}</td>
                      <td className="text-right p-2">{percentage}</td>
                      {hasFilter && (
                        <td className="text-right p-2 text-blue-300">
                          {filteredPercentage}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  },
};

import { ValueViewer } from ".";
import React from "react";
import { aggregateValues } from "./aggregate";

export const tableViewer: ValueViewer = {
  name: "Table",
  shouldRender: (values) => {
    if (values.length < 2) return "hide";
    const groupedByKeys = aggregateValues(values.map((v) => v.value));
    if (!groupedByKeys.some((g) => g.groups.length > 1)) return "hide";
    return "normal";
  },
  component: ({ values }) => {
    const groupedByKeys = aggregateValues(values.map((v) => v.value));

    return (
      <div className="flex flex-col gap-4">
        {groupedByKeys.map((group) => (
          <div key={group.key} className="w-full">
            {groupedByKeys.length > 1 && (
              <div className="font-medium mb-2">{group.key}</div>
            )}
            <table className="w-full text-sm">
              <tbody>
                {group.groups.map((row) => {
                  const percentage = (
                    (row.count / values.length) *
                    100
                  ).toFixed(2);
                  return (
                    <tr key={row.name} className="border-t">
                      <td className="p-2">{row.name}</td>
                      <td className="text-right p-2">{percentage}%</td>
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

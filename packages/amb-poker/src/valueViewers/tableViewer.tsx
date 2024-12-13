import { ValueViewer } from ".";
import React from "react";
import { aggregateValues, formatPercentage } from "./aggregate";

export const tableViewer: ValueViewer = {
  name: "Table",
  shouldRender: ({ scenarios, cellToDisplay }) => {
    if (scenarios.length < 2) return "hide";
    const groupedByKeys = aggregateValues(
      scenarios.map((s) => s[cellToDisplay])
    );
    if (!groupedByKeys.some((g) => g.groups.length > 1)) return "hide";
    return "normal";
  },
  component: ({ scenarios, cellToDisplay, filters }) => {
    const values = scenarios.map((s) => s[cellToDisplay]);
    const groupedByKeys = aggregateValues(values);

    // For each filter, get the filtered values and aggregate them
    const filterAggregates = filters.map((filterName) => {
      // todo: is truthy good here? should we centralize this filter logic?
      const filteredScenarios = scenarios.filter((s) => s[filterName]);
      const filteredValues = filteredScenarios.map((s) => s[cellToDisplay]);
      return {
        name: filterName,
        aggregates: aggregateValues(filteredValues),
      };
    });

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
                  <th className="text-right p-2">All</th>
                  {filters.map((filterName) => (
                    <th key={filterName} className="text-right p-2">
                      {filterName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.groups.map((row) => {
                  return (
                    <tr key={row.name} className="border-t">
                      <td className="p-2">{row.name}</td>
                      <td className="text-right p-2">
                        {formatPercentage(row.percentage)}
                      </td>
                      {filterAggregates.map(({ name, aggregates }) => {
                        const matchingGroup = aggregates.find(
                          (g) => g.key === group.key
                        );
                        const matchingRow = matchingGroup?.groups.find(
                          (r) => r.name === row.name
                        );
                        return (
                          <td key={name} className="text-right p-2">
                            {matchingRow
                              ? formatPercentage(matchingRow.percentage)
                              : "-"}
                          </td>
                        );
                      })}
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

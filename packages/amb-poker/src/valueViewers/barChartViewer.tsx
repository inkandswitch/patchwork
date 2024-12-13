import { ValueViewer } from ".";
import React from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
  Legend,
} from "recharts";
import { aggregateValues } from "./aggregate";

const COLORS = ["#fff", "#93c5fd", "#fca5a5", "#86efac", "#fcd34d"];

export const barChartViewer: ValueViewer = {
  name: "Bar Chart",
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

    // Get aggregates for each filter
    const filterAggregates = filters.map((filterName) => {
      const filteredScenarios = scenarios.filter((s) => s[filterName]);
      const filteredValues = filteredScenarios.map((s) => s[cellToDisplay]);
      return {
        name: filterName,
        aggregates: aggregateValues(filteredValues),
      };
    });

    // Transform data to include overall and filtered percentages
    const transformedData = groupedByKeys.map((group) => {
      return {
        key: group.key,
        data: group.groups.map((row) => {
          const result: { [key: string]: number | string } = {
            name: row.name,
            Overall: row.percentage,
          };

          // Add data for each filter
          filterAggregates.forEach(({ name, aggregates }) => {
            const matchingGroup = aggregates.find((g) => g.key === group.key);
            const matchingRow = matchingGroup?.groups.find(
              (r) => r.name === row.name
            );
            result[name] = matchingRow?.percentage || 0;
          });

          return result;
        }),
      };
    });

    return (
      <div className="flex flex-col gap-2">
        <div>
          {transformedData.map((group) => (
            <div key={group.key}>
              {transformedData.length > 1 && <div>{group.key}</div>}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={group.data}>
                  <XAxis dataKey="name" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Bar
                    dataKey="Overall"
                    fill={COLORS[0]}
                    opacity={0.8}
                    name="Overall"
                  />
                  {filters.map((filterName, index) => (
                    <Bar
                      key={filterName}
                      dataKey={filterName}
                      fill={COLORS[(index + 1) % COLORS.length]}
                      opacity={0.8}
                      name={filterName}
                    />
                  ))}
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

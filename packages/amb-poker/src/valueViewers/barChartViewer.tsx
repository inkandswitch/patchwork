import { ValueViewer } from ".";
import React from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
} from "recharts";
import { aggregateValues } from "./aggregate";
import { sortBy } from "lodash-es";

export const barChartViewer: ValueViewer = {
  name: "Bar Chart",
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

    // Transform data to include both overall and filtered percentages
    const transformedData = groupedByKeys.map((group, i) => {
      return {
        key: group.key,
        data: group.groups.map((row) => {
          const filteredGroup = filteredGroupedByKeys?.[i]?.groups.find(
            (g) => g.name === row.name
          );

          return {
            name: row.name,
            overall: row.percentage,
            filtered: filteredGroup?.percentage || 0,
          };
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
                    dataKey="overall"
                    fill="#fff"
                    opacity={0.8}
                    name="Overall"
                  />
                  {hasFilter && (
                    <Bar
                      dataKey="filtered"
                      fill="#93c5fd"
                      opacity={0.8}
                      name="Filtered"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

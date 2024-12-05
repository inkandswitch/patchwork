import React, { PureComponent } from "react";
import { ValueViewer, ValueViewerProps } from "./CellDetails";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import { FilteredValue } from "../eval";
import { isArray } from "lodash";
import { AmbRange } from "../datatype";

// color scheme from https://observablehq.com/@d3/color-schemes
const CATEGORY_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

const data = [
  {
    name: "2024",
    pessimistic: 100,
    optimistic: 200,
  },
  {
    name: "2025",
    pessimistic: 200,
    optimistic: 400,
  },
  {
    name: "2026",
    pessimistic: 300,
    optimistic: 700,
  },
];

const makeChartData = (values: Array<FilteredValue>) => {
  const xValues =
    (values[0].value.rawValue as AmbRange)?.map(([x, y]) => x) ?? [];
  const data = [];
  for (const xValue of xValues) {
    let obj: { name: string } & { [key: string]: number } = { name: xValue };
    for (const value of values) {
      if (!isArray(value.value.rawValue)) {
        throw new Error("whoops");
      }
      const seriesName = Array.from(value.value.context.values()).join(",");
      const seriesValue = value.value.rawValue?.find(
        ([x, y]) => x === xValue
      )?.[1];
      if (seriesValue) {
        obj[seriesName] = seriesValue;
      }
    }
    data.push(obj);
  }
  return data;
};

export const Chart = ({ values, setFilterSelection }: ValueViewerProps) => {
  console.log("CHART VALUES", values);

  const chartData = makeChartData(values);
  const seriesNames = Object.keys(chartData[0]).filter((key) => key !== "name");
  console.log("CHART DATA", chartData);

  return (
    <div className="text-xs text-gray-400 w-64 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {seriesNames.map((seriesName, index) => (
            <>
              <Line
                key={seriesName}
                type="monotone"
                dataKey={seriesName}
                stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                activeDot={{ r: 8 }}
              />
              <Label
                position="right"
                offset={10}
                content={({ value }) => (
                  <text fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}>
                    {seriesName}
                  </text>
                )}
              />
            </>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const chartViewer: ValueViewer = {
  name: "Chart",
  shouldRender: (values) => {
    // For now, always hide until implemented
    return values.every((value) => isArray(value.value.rawValue))
      ? "high"
      : "hide";
  },
  component: Chart,
};

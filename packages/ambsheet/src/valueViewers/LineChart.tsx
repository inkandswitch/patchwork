import React from "react";
import { ValueViewer, ValueViewerProps } from ".";
import { isArray } from "lodash";
import { AmbRange } from "../datatype";
import * as Plot from "@observablehq/plot";
import { Env, FilteredValue } from "../eval";
import { displayNameForCell, printRawValue } from "../print";

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

// This function produces data in the form expected by Observable Plot:
// [ { x: "2024", y: 100, series: "series1" }, { x: "2024", y: 200, series: "series2" }, ... ]
const makeChartData = (values: Array<FilteredValue>, sheet: Env) => {
  const data = [];
  for (const value of values) {
    if (!isArray(value.value.rawValue)) {
      throw new Error("whoops");
    }

    // const seriesName = Array.from(value.value.context.values()).join(",");
    const seriesName = [...value.value.context]
      .map(([ambNode, index]) => {
        const cellName = displayNameForCell(ambNode.pos, sheet);
        const cellValue = sheet.results[ambNode.pos.row][ambNode.pos.col];
        if (!isArray(cellValue)) {
          return `${cellName}: ???`;
        }
        return `${cellName}=${printRawValue(cellValue[index].rawValue)}`;
      })
      .join(", ");
    for (const [x, y] of value.value.rawValue) {
      data.push({
        x,
        y: Number(y),
        series: seriesName,
        include: value.include,
      });
    }
  }
  return data;
};

export const LineChart = ({ values, sheet }: ValueViewerProps) => {
  const chartData = makeChartData(values, sheet);
  const seriesNames = [...new Set(chartData.map((d) => d.series))];

  React.useEffect(() => {
    const chart = Plot.plot({
      width: 300,
      height: 200,
      margin: 30,
      marginLeft: 50,
      grid: true,
      color: {
        domain: seriesNames,
        range: seriesNames.map((series) => {
          const shouldBeGreyedOut = chartData.find(
            (d) => d.series === series && !d.include
          );
          return shouldBeGreyedOut
            ? "#ccc"
            : CATEGORY_COLORS[
                seriesNames.indexOf(series) % CATEGORY_COLORS.length
              ];
        }),
        legend: true,
      },
      marks: [
        Plot.line(chartData, {
          x: "x",
          y: "y",
          stroke: "series",
          strokeWidth: 2,
        }),
      ],
    });

    const container = document.getElementById("plot-container");
    if (container) {
      container.innerHTML = "";
      container.appendChild(chart);
    }

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [chartData]);

  return <div id="plot-container" className="text-xs text-gray-400" />;
};

export const chartViewer: ValueViewer = {
  name: "Line Chart",
  shouldRender: (values) => {
    return values.every((value) => isArray(value.value.rawValue))
      ? "high"
      : "hide";
  },
  component: LineChart,
};

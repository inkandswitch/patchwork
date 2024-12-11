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
    const groupedByKeys = aggregateValues(values.map((v) => v.value));

    return (
      <div className="flex flex-col gap-2">
        <div>
          {groupedByKeys.map((group) => (
            <div key={group.key}>
              {groupedByKeys.length > 1 && <div>{group.key}</div>}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={group.groups}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

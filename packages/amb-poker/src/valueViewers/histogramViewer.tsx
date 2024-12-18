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
const NUM_BUCKETS = 10;

// Helper function to create buckets for a range of numbers
const createBuckets = (values: number[]) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const bucketSize = range / NUM_BUCKETS;

  // Create bucket ranges
  const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => ({
    start: min + i * bucketSize,
    end: min + (i + 1) * bucketSize,
    count: 0,
    percentage: 0,
  }));

  // Count values in each bucket
  values.forEach((value) => {
    const bucketIndex = Math.min(
      Math.floor((value - min) / bucketSize),
      NUM_BUCKETS - 1
    );
    buckets[bucketIndex].count++;
  });

  // Calculate percentages
  const total = values.length;
  buckets.forEach((bucket) => {
    bucket.percentage = (bucket.count / total) * 100;
  });

  return buckets;
};

// Format bucket range for display
const formatBucketRange = (start: number, end: number) => {
  return `${start.toFixed(1)}-${end.toFixed(1)}`;
};

export const histogramViewer: ValueViewer = {
  name: "Histogram",
  shouldRender: ({ scenarios, cellToDisplay }) => {
    if (scenarios.length < 2) return "hide";

    // Check if values are numbers and if there are enough unique values
    const values = scenarios.map((s) => s[cellToDisplay]);
    if (!values.every((v) => typeof v === "number")) return "hide";

    const uniqueValues = new Set(values);
    if (uniqueValues.size < 5) return "hide"; // Too few unique values
    if (uniqueValues.size > 20) return "high"; // Many unique values - prefer histogram
    return "normal";
  },

  component: ({ scenarios, cellToDisplay, filters }) => {
    // Get all numeric values
    const values = scenarios.map((s) => s[cellToDisplay] as number);
    const buckets = createBuckets(values);

    // Get buckets for each filter
    const filterBuckets = filters.map((filterName) => {
      const filteredScenarios = scenarios.filter((s) => s[filterName]);
      const filteredValues = filteredScenarios.map(
        (s) => s[cellToDisplay] as number
      );
      return {
        name: filterName,
        buckets: createBuckets(filteredValues),
      };
    });

    // Transform data for the chart
    const chartData = buckets.map((bucket, i) => {
      const data: { [key: string]: number | string } = {
        name: formatBucketRange(bucket.start, bucket.end),
        Overall: bucket.percentage,
      };

      // Add data for each filter
      filterBuckets.forEach(({ name, buckets }) => {
        data[name] = buckets[i].percentage;
      });

      return data;
    });

    return (
      <div className="flex flex-col gap-2">
        <ResponsiveContainer width="100%" height={200} minWidth={300}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              stroke="#fff"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              fontSize={10}
            />
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
    );
  },
};

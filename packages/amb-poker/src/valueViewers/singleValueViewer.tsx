import { ValueViewer } from "./index";
import { uniq } from "lodash-es";

// This just displays a primitive JS value (string, number, boolean)
// which is the same for all scenarios.
// Eg: if you write =123 as a formula, this'll show 123.

export const singleValueViewer: ValueViewer = {
  name: "Single Value",
  shouldRender: ({ scenarios, cellToDisplay }) => {
    if (scenarios.length === 0) return "hide";

    const values = scenarios.map((s) => s[cellToDisplay]);
    const firstValue = values[0];

    // Check if value is a primitive type we can handle
    if (
      typeof firstValue !== "string" &&
      typeof firstValue !== "number" &&
      typeof firstValue !== "boolean"
    ) {
      return "hide";
    }

    // Check if all values are the same
    if (uniq(values).length !== 1) {
      return "hide";
    }

    return "normal";
  },
  component: ({ scenarios, cellToDisplay }) => {
    const value = scenarios[0][cellToDisplay];
    return (
      <div className="p-2 bg-black bg-opacity-30 rounded">{String(value)}</div>
    );
  },
};

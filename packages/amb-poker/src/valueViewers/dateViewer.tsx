import { ValueViewer } from "./index";
import { uniq } from "lodash-es";

type DateValue = {
  type: "date";
  value: number;
};

const isDateValue = (value: any): value is DateValue => {
  return (
    value &&
    typeof value === "object" &&
    value.type === "date" &&
    typeof value.value === "number"
  );
};

// This displays a date value which is the same for all scenarios
// in a nicely formatted way
export const dateViewer: ValueViewer = {
  name: "Date",
  shouldRender: ({ scenarios, cellToDisplay }) => {
    if (scenarios.length === 0) return "hide";

    const values = scenarios.map((s) => s[cellToDisplay]);
    const firstValue = values[0];

    // Check if value is our date format
    if (!isDateValue(firstValue)) {
      return "hide";
    }

    // Check if all values are the same
    if (uniq(values.map((d) => (d as any).value)).length !== 1) {
      return "hide";
    }

    return "normal";
  },
  component: ({ scenarios, cellToDisplay }) => {
    const dateValue = scenarios[0][cellToDisplay] as unknown as DateValue;
    const date = new Date(dateValue.value);

    return (
      <div className="p-2 bg-black bg-opacity-30 rounded">
        {date.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    );
  },
};

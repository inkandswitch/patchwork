import { ValueViewer } from ".";
import { PokerHand } from "../handEvaluation";
import { getRank, getSuit, isCard, Value } from "../model";
import groupBy from "lodash-es/groupBy";

import React, { PureComponent } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
  Tooltip,
  YAxis,
  XAxis,
} from "recharts";

// This function turns a value into an object with properties of primitive type.
// The properties should be suitable for aggregating a list of values into useful groups.
// TODO: where *should* this mapping live? Probably not here in a viewer.
const turnValueIntoAggregatableObject = (
  value: Value
): { [key: string]: string | boolean | number } => {
  if (isCard(value)) {
    return { rank: getRank(value), suit: getSuit(value) };
  } else if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return { value };
  } else if (value instanceof PokerHand) {
    return { handType: value.type };
  } else {
    const _exhaustiveCheck: never = value;
    return {};
  }
};

export const barChartViewer: ValueViewer = {
  name: "Bar Chart",
  shouldRender: (values) => {
    if (values.length < 2) return "hide";
    if (values.length < 10) return "normal";
    return "high";
  },
  component: ({ values }) => {
    const aggregatables = values.map((v) =>
      turnValueIntoAggregatableObject(v.value)
    );
    const keys = Object.keys(aggregatables[0]!);

    // Group by each key and count occurrences
    const groupedByKeys = keys.map((key) => ({
      key,
      groups: Object.entries(groupBy(aggregatables, key)).map(
        ([name, items]) => ({
          name,
          count: items.length,
        })
      ),
    }));

    console.log({ groupedByKeys });

    return (
      <div className="flex flex-col gap-2">
        <div>
          {groupedByKeys.map((group) => (
            <div key={group.key}>
              {groupedByKeys.length > 1 && <div>{group.key}</div>}
              <ResponsiveContainer width={300} height={70}>
                <BarChart data={group.groups} width={400} height={70}>
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

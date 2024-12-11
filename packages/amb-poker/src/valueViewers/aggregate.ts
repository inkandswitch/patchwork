import { Value } from "../model";
import { PokerHand } from "../handEvaluation";
import { getRank, getSuit, isCard } from "../model";
import groupBy from "lodash-es/groupBy";

// This function turns a value into an object with properties of primitive type.
// The properties should be suitable for aggregating a list of values into useful groups.
export const turnValueIntoAggregatableObject = (
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

export type AggregateGroup = {
  key: string;
  groups: {
    name: string;
    count: number;
  }[];
};

export const aggregateValues = (values: Value[]): AggregateGroup[] => {
  const aggregatables = values.map((v) => turnValueIntoAggregatableObject(v));
  const keys = Object.keys(aggregatables[0]!);

  // Group by each key and count occurrences
  return keys.map((key) => ({
    key,
    groups: Object.entries(groupBy(aggregatables, key)).map(
      ([name, items]) => ({
        name,
        count: items.length,
      })
    ),
  }));
};

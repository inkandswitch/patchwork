import { Card, Value } from "../model";
import { cardRank, handRank, PokerHand } from "../handEvaluation";
import { getRank, getSuit, isCard } from "../model";
import groupBy from "lodash-es/groupBy";
import sortBy from "lodash-es/sortBy";

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

export type GroupedValues = {
  key: string;
  groups: {
    name: string;
    count: number;
    percentage: number;
  }[];
};

export const formatPercentage = (percentage: number): string =>
  percentage === 0
    ? "--"
    : percentage >= 10
    ? `${Math.round(percentage)}%`
    : `${percentage.toFixed(1)}%`;

export const aggregateValues = (values: Value[]): GroupedValues[] => {
  const aggregatables = values.map((v) => turnValueIntoAggregatableObject(v));
  const keys = Object.keys(aggregatables[0]!);

  // Group by each key and count occurrences
  return keys.map((key) => {
    const groups = Object.entries(groupBy(aggregatables, key)).map(
      ([name, items]) => ({
        name,
        count: items.length,
        percentage: (items.length / values.length) * 100,
      })
    );

    const groupsForKey = {
      key,
      groups,
    };

    // This is a hack for now -- sort the aggregated groups w/ a special case for poker hands.
    // TODO: think about where aggregation and sorting logic should go.
    if (values.every((v) => v instanceof PokerHand)) {
      groupsForKey.groups = sortBy(groupsForKey.groups, (g) =>
        handRank(g.name)
      );
    }

    if (values.every((v) => isCard(v)) && key === "rank") {
      groupsForKey.groups = sortBy(
        groupsForKey.groups,
        (g) => cardRank(`${g.name}S` as Card) // arbitrary suit
      );
    }

    return groupsForKey;
  });
};

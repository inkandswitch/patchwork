import { Engine } from "./engine";
import { bestHand, PokerHand } from "./handEvaluation";

const allRanks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
] as const;
const allSuits = ["H", "D", "C", "S"] as const;
export const allCards = allRanks.flatMap((rank) =>
  allSuits.map((suit) => `${rank}${suit}` as Card)
);

export const isCard = (value: any): value is Card => {
  return (
    typeof value === "string" &&
    value.length === 2 &&
    allRanks.includes(value[0] as Rank) &&
    allSuits.includes(value[1] as Suit)
  );
};

export type Rank = (typeof allRanks)[number];
export type Suit = (typeof allSuits)[number];
export type Card = `${Rank}${Suit}`;

export const getRank = (card: Card) => card[0];
export const getSuit = (card: Card) => card[1];

// in this limited language we only support cards, numbers and booleans.
type UnknownCard = "?";
type Term = Value | UnknownCard;

export type Value = number | boolean | string | Card | PokerHand;

// A tiny stub of the deal function. TODO: make this real
const deal = (card: Card | UnknownCard = "?"): Card | UnknownCard => card;

// A scenario is a mapping of each cell to a concrete value.
// (These were called "contexts" in the previous ambsheet, but scenario is a better name.)
export type Scenario = {
  [key: string]: Value;
};

export type Model = {
  cells: {
    [key: string]: Card | UnknownCard;
  };
  addComputedValues: (scenario: Scenario) => void;
};

export const SAMPLE_MODEL: Model = {
  cells: {
    myCard1: deal("AS"),
    myCard2: deal("3S"),
    theirCard1: deal(),
    theirCard2: deal(),
    commCard1: deal("7C"),
    commCard2: deal("2H"),
    commCard3: deal("3H"),
    commCard4: deal(),
    commCard5: deal(),
  },
  addComputedValues(scenario) {
    const myHand = bestHand([
      scenario.myCard1 as Card,
      scenario.myCard2 as Card,
      scenario.commCard1 as Card,
      scenario.commCard2 as Card,
      scenario.commCard3 as Card,
      scenario.commCard4 as Card,
      scenario.commCard5 as Card,
    ]);
    const theirHand = bestHand([
      scenario.theirCard1 as Card,
      scenario.theirCard2 as Card,
      scenario.commCard1 as Card,
      scenario.commCard2 as Card,
      scenario.commCard3 as Card,
      scenario.commCard4 as Card,
      scenario.commCard5 as Card,
    ]);

    scenario.myHand = myHand;
    scenario.theirHand = theirHand;
    scenario.iWin = myHand.beats(theirHand);
  },
};

const test = () => {
  const savedContexts: Scenario[] = [];
  const engine = new Engine(SAMPLE_MODEL, (context) =>
    savedContexts.push(context)
  );

  for (let i = 0; i < 100; i++) {
    engine.next();
  }
  console.log(savedContexts);
};

test();

// engine.cardinality() // => 1326
// engine.cardinality("iWin") // => 450
// const winningPercentage = engine.cardinality("iWin") / engine.cardinality() // => 0.3386
// engine.value("iWin") = [{value: true, context: { ... }}, ... ]

// engine.evalFormula("iWin", scenario);

// class Result {
//   context() {}
//   formula(name) {}
// }

// notes
// lazy generators don't need to be fully evaluated
// they keep track of how many values they have left to generate (if finite)

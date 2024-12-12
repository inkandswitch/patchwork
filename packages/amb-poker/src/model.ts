import { Engine, FilteredScenario } from "./engine";
import { PokerHand } from "./handEvaluation";

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
  cells: Record<string, string>;
  filter?: string;
};

export const SAMPLE_MODEL: Model = {
  cells: {
    // a: "=1+2",
    // b: "=a*4-1",
    // c: "=b/5",
    myCard1: "AS",
    myCard2: "3S",
    theirCard1: "=deal()",
    theirCard2: "=deal()",
    commCard1: "7C",
    commCard2: "2H",
    commCard3: "3H",
    commCard4: "=deal()",
    commCard5: "=deal()",
    myHand:
      "=bestHand(myCard1, myCard2, commCard1, commCard2, commCard3, commCard4, commCard5)",
    theirHand:
      "=bestHand(theirCard1, theirCard2, commCard1, commCard2, commCard3, commCard4, commCard5)",
    iWin: "=myHand < theirHand",
  },
  filter: "=iWin", // this can be any formula!
};

const test = () => {
  const savedContexts: FilteredScenario[] = [];
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

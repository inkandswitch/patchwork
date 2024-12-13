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
  cells: {
    name: string;
    formula: string;
  }[];
  filters: string[];
};

export const SAMPLE_MODEL: Model = {
  cells: [
    {
      name: "myCard1",
      formula: "AS",
    },
    {
      name: "myCard2",
      formula: "3S",
    },
    {
      name: "theirCard1",
      formula: "=deal()",
    },
    {
      name: "theirCard2",
      formula: "=deal()",
    },
    {
      name: "commCard1",
      formula: "7C",
    },
    {
      name: "commCard2",
      formula: "2H",
    },
    {
      name: "commCard3",
      formula: "3H",
    },
    {
      name: "commCard4",
      formula: "=deal()",
    },
    {
      name: "commCard5",
      formula: "=deal()",
    },
    {
      name: "myHand",
      formula:
        "=bestHand(myCard1, myCard2, commCard1, commCard2, commCard3, commCard4, commCard5)",
    },
    {
      name: "theirHand",
      formula:
        "=bestHand(theirCard1, theirCard2, commCard1, commCard2, commCard3, commCard4, commCard5)",
    },
    {
      name: "iWin",
      formula: "=myHand > theirHand",
    },
    {
      name: "theyHaveAPair",
      formula: '=handType(theirHand) = "pair"',
    },
    {
      name: "iHaveAPair",
      formula: '=handType(myHand) = "pair"',
    },
  ],
  filters: ["iWin", "theyHaveAPair", "iHaveAPair", "aceOnTurnOrRiver"],
};

// notes
// lazy generators don't need to be fully evaluated
// they keep track of how many values they have left to generate (if finite)

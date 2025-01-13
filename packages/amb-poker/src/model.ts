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
type DateValue = {
  type: "date";
  value: number;
};
export type Value = number | boolean | string | Card | PokerHand | DateValue;

// A scenario is a mapping of each cell to a concrete value.
// (These were called "contexts" in the previous ambsheet, but scenario is a better name.)
export type Scenario = {
  [key: string]: Value;
};

export type Model = {
  cells: {
    name: string;
    formula: string;
    position: { x: number; y: number };
    defaultViewer?: string;
  }[];
  filters: string[];
};

const PADDING = 50;
const ROW_HEIGHT = 170;
const COL_WIDTH = 120;

export const SAMPLE_MODEL: Model = {
  cells: [
    // Row 0 - Their cards
    {
      name: "theirCard1",
      formula: "=deal()",
      position: { x: PADDING + 0 * COL_WIDTH, y: PADDING + 0 * ROW_HEIGHT },
    },
    {
      name: "theirCard2",
      formula: "=deal()",
      position: { x: PADDING + 1 * COL_WIDTH, y: PADDING + 0 * ROW_HEIGHT },
    },
    // Row 1 - Community cards
    {
      name: "commCard1",
      formula: `=deal()`,
      position: { x: PADDING + 0 * COL_WIDTH, y: PADDING + 1 * ROW_HEIGHT },
    },
    {
      name: "commCard2",
      formula: `=deal()`,
      position: { x: PADDING + 1 * COL_WIDTH, y: PADDING + 1 * ROW_HEIGHT },
    },
    {
      name: "commCard3",
      formula: `=deal()`,
      position: { x: PADDING + 2 * COL_WIDTH, y: PADDING + 1 * ROW_HEIGHT },
    },
    {
      name: "commCard4",
      formula: "=deal()",
      position: { x: PADDING + 3 * COL_WIDTH, y: PADDING + 1 * ROW_HEIGHT },
    },
    {
      name: "commCard5",
      formula: "=deal()",
      position: { x: PADDING + 4 * COL_WIDTH, y: PADDING + 1 * ROW_HEIGHT },
    },
    // Row 2 - My cards
    {
      name: "myCard1",
      formula: `=deal("AS")`,
      position: { x: PADDING + 0 * COL_WIDTH, y: PADDING + 2 * ROW_HEIGHT },
    },
    {
      name: "myCard2",
      formula: `=deal("3S")`,
      position: { x: PADDING + 1 * COL_WIDTH, y: PADDING + 2 * ROW_HEIGHT },
    },
    // Row 3 - Results
    {
      name: "myHand",
      formula:
        "=bestHand(myCard1, myCard2, commCard1, commCard2, commCard3, commCard4, commCard5)",
      position: { x: PADDING + 0 * COL_WIDTH, y: PADDING + 3.2 * ROW_HEIGHT },
    },
    {
      name: "theirHand",
      formula:
        "=bestHand(theirCard1, theirCard2, commCard1, commCard2, commCard3, commCard4, commCard5)",
      position: {
        x: PADDING + 1 * (COL_WIDTH * 1.5),
        y: PADDING + 3.2 * ROW_HEIGHT,
      },
    },
    {
      name: "iWin",
      formula: "=myHand > theirHand",
      position: {
        x: PADDING + 2 * (COL_WIDTH * 1.5),
        y: PADDING + 3.2 * ROW_HEIGHT,
      },
    },
    {
      name: "iHaveAStraight",
      formula: '=handType(myHand) = "straight"',
      position: {
        x: PADDING + 3 * (COL_WIDTH * 1.5),
        y: PADDING + 3.2 * ROW_HEIGHT,
      },
    },
  ],
  filters: [],
};

// notes
// lazy generators don't need to be fully evaluated
// they keep track of how many values they have left to generate (if finite)

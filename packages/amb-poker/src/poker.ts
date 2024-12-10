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
const allCards = allRanks.flatMap((rank) =>
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

type Rank = (typeof allRanks)[number];
type Suit = (typeof allSuits)[number];
export type Card = `${Rank}${Suit}`;

// in this limited language we only support cards, numbers and booleans.
type UnknownCard = "?";
type Term = Value | UnknownCard;

type Value = Card | number | boolean;

// A tiny stub of the deal function. TODO: make this real
const deal = (card?: Card): Card | UnknownCard => {
  if (card) {
    return card;
  }
  return "?";
};

export type Model = {
  cells: {
    [key: string]: Card | UnknownCard;
  };
  // todo: formulas
};

type Formula = (model: Model) => Value;

export const SAMPLE_MODEL = {
  cells: {
    myCard1: deal("AS"),
    myCard2: deal("KS"),
    theirCard1: deal(),
    theirCard2: deal(),
    communityCard1: deal("QS"),
    communityCard2: deal("JS"),
    communityCard3: deal("TS"),
    communityCard4: deal(),
    communityCard5: deal(),
  },
  formulas: {
    // valueOfMyHand: (sheet) => {
    //   const myHand = [...sheet.eval("myHoleCards"), ...sheet.eval("communityCards")]
    //   /// ...  stuff ...
    //   return new HandQuality({ type: "pair", value: 7 })
    // },
    // valueOfTheirHand: (sheet) => {
    //   const theirHand = [...sheet.eval("theirHoleCards"), ...sheet.eval("communityCards")]
    //   /// ...  stuff ...
    //   return new HandQuality({ type: "pair", value: 7 })
    // },
    // iWin: (sheet) => {
    //   return HandQuality.greaterThan(sheet.eval("valueOfMyHand"), sheet.eval("valueOfTheirHand"))
    // }
    // myHoleCards: (sheet) => {
    //   return [sheet.eval("myCard1"), sheet.eval("myCard2")]
    // },
    // theirHoleCards: (sheet) => {
    //   return [sheet.eval("theirCard1"), sheet.eval("theirCard2")]
    // },
    // communityCards: (sheet) => {
    //   return [sheet.eval("communityCard1"), sheet.eval("communityCard2"), sheet.eval("communityCard3"), sheet.eval("communityCard4"), sheet.eval("communityCard5")]
    // }
  },
};

// A scenario is a mapping of each cell to a concrete value.
// (These were called "contexts" in the previous ambsheet, but scenario is a better name.)
export type Scenario = {
  [key: string]: Value;
};

export class Engine {
  model: Model;
  callback: (scenario: Scenario) => void;

  constructor(model: Model, callback: (result: Scenario) => void) {
    this.model = model;
    this.callback = callback;
  }

  next() {
    const scenario: Scenario = {};

    // For each cell in the model
    for (const [cellName, cell] of Object.entries(this.model.cells)) {
      if (
        isCard(cell) ||
        typeof cell === "number" ||
        typeof cell === "boolean"
      ) {
        scenario[cellName] = cell;
      } else if (cell === "?") {
        // Get a random card that's not already used in the context
        const availableCards = allCards.filter(
          (c) => !Object.values(scenario).includes(c)
        );
        const randomIndex = Math.floor(Math.random() * availableCards.length);

        scenario[cellName] = availableCards[randomIndex];
      }
    }

    this.callback(scenario);
    return scenario;
  }
}

const test = () => {
  const savedContexts: Scenario[] = [];
  const engine = new Engine(SAMPLE_MODEL, (context) =>
    savedContexts.push(context)
  );

  for (let i = 0; i < 1000; i++) {
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

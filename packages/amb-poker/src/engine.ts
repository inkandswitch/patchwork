import { Model, Scenario, isCard, allCards, Value, Card } from "./model";
import { compileCell, fns } from "./compiler";
import { bestHand, PokerHand } from "./handEvaluation";

// arithmetic operators

fns["+"] = (x, y) => {
  if (typeof x === "number" && typeof y === "number") {
    return x + y;
  } else if (typeof x === "string" && typeof y === "string") {
    return x + y;
  } else {
    throw new Error("operand + used with invalid operands");
  }
};

fns["-"] = (x, y) => {
  if (typeof x === "number" && typeof y === "number") {
    return x - y;
  } else {
    throw new Error("operand - used with invalid operands");
  }
};

fns["*"] = (x, y) => {
  if (typeof x === "number" && typeof y === "number") {
    return x * y;
  } else {
    throw new Error("operand * used with invalid operands");
  }
};

fns["/"] = (x, y) => {
  if (typeof x === "number" && typeof y === "number") {
    return x / y;
  } else {
    throw new Error("operand / used with invalid operands");
  }
};

// relational operators

fns["="] = (x, y) => {
  if (typeof x === "number" && typeof y === "number") {
    return x === y;
  } else if (typeof x === "string" && typeof y === "string") {
    return x === y;
  } else if (typeof x === "boolean" && typeof y === "boolean") {
    return x === y;
  } else if (x instanceof PokerHand && y instanceof PokerHand) {
    return !x.beats(y) && !y.beats(x);
  } else {
    throw new Error("operand = used with invalid operands");
  }
};

fns["<>"] = (x, y) => !fns["="](x, y);

fns[">="] = (x, y) => fns["<"](y, x);

fns[">"] = (x, y) => fns[">="](x, y) && !fns["="](x, y);

fns["<="] = (x, y) => fns["<"](x, y) || fns["="](x, y);

fns["<"] = (x, y) => {
  if (typeof x === "number" && typeof y === "number") {
    return x < y;
  } else if (typeof x === "string" && typeof y === "string") {
    return x < y;
  } else if (typeof x === "boolean" && typeof y === "boolean") {
    return x < y;
  } else if (x instanceof PokerHand && y instanceof PokerHand) {
    return y.beats(x);
  } else {
    throw new Error("operand < used with invalid operands");
  }
};

// card and hand functions

let remainingCards: Card[] = [];
fns.deal = () => {
  // Get one of the remaining cards at random
  const idx = Math.floor(Math.random() * remainingCards.length);
  const card = remainingCards[idx];
  remainingCards.splice(idx, 1);
  return card;
};

fns.bestHand = (...cards) => {
  try {
    return bestHand(cards as Card[]);
  } catch (e) {
    console.log(e);
    debugger;
  }
  return null as any;
};

fns.beats = (hand1, hand2) => (hand1 as PokerHand).beats(hand2 as PokerHand);

type CompiledModel = {
  cells: Record<string, Value | ((s: Scenario) => Value)>;
  filter?: Value | ((s: Scenario) => Value); // truthy means the scenario should be included
};

function compile(model: Model): CompiledModel {
  const cm: CompiledModel = { cells: {} };
  for (const [name, src] of Object.entries(model.cells)) {
    cm.cells[name] = compileCell(src);
  }
  if (model.filter) {
    cm.filter = compileCell(model.filter);
  }
  return cm;
}

export type FilteredScenario = {
  scenario: Scenario;
  include: boolean;
};

export class Engine {
  readonly compiledModel: CompiledModel;
  readonly callback: (s: FilteredScenario) => void;
  readonly dealtCards = new Set<Card>();

  constructor(model: Model, callback: (result: FilteredScenario) => void) {
    this.compiledModel = compile(model);
    this.callback = callback;

    for (const value of Object.values(this.compiledModel)) {
      if (isCard(value)) {
        this.dealtCards.add(value);
      }
    }
  }

  next() {
    // this is the state that makes deal() work
    remainingCards = allCards.filter((c) => !this.dealtCards.has(c));

    // For each cell in the model
    const scenario: Scenario = {};
    for (const [cellName, fnOrValue] of Object.entries(
      this.compiledModel.cells
    )) {
      scenario[cellName] =
        fnOrValue instanceof Function ? fnOrValue(scenario) : fnOrValue;
    }

    const include = !this.compiledModel.filter
      ? true
      : this.compiledModel.filter instanceof Function
      ? !!this.compiledModel.filter(scenario)
      : !!this.compiledModel.filter;

    this.callback({ scenario, include });
    return scenario;
  }
}

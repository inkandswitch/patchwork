import { Model, Scenario, isCard, allCards, Value, Card } from "./model";
import { compileCell, fns } from "./compiler";
import { bestHand, cardRank, PokerHand } from "./handEvaluation";

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

// boolean functions

fns.and = (...xs) => xs.reduce((acc, x) => acc && !!x, true);

fns.or = (...xs) => xs.reduce((acc, x) => acc || !!x, false);

fns.not = (x) => !x;

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
  if (cards.some((c) => !isCard(c))) {
    throw new Error(`bestHand used with invalid card: ${cards}`);
  }
  try {
    return bestHand(cards as Card[]);
  } catch (e) {
    console.log(e);
    debugger;
  }
  return null as any;
};

fns.beats = (hand1, hand2) => (hand1 as PokerHand).beats(hand2 as PokerHand);

fns.handType = (hand) => (hand as PokerHand).type;

fns.cardRank = (card) => cardRank(card as Card);

type CompiledModel = {
  cells: {
    name: string;
    fn: Value | ((s: Scenario) => Value);
  }[];
  filter?: Value | ((s: Scenario) => Value); // truthy means the scenario should be included
};

function compile(model: Model): CompiledModel {
  const cm: CompiledModel = { cells: [] };
  for (const cell of model.cells) {
    cm.cells.push({
      name: cell.name,
      fn: compileCell(cell.formula),
    });
  }
  return cm;
}

export class Engine {
  readonly compiledModel: CompiledModel;
  readonly callback: (s: Scenario) => void;
  readonly dealtCards = new Set<Card>();

  constructor(model: Model, callback: (result: Scenario) => void) {
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
    // TODO: properly manage dependency order, don't just execute in order of cell definition
    for (const cell of this.compiledModel.cells) {
      scenario[cell.name] =
        cell.fn instanceof Function ? cell.fn(scenario) : cell.fn;
    }

    this.callback(scenario);
    return scenario;
  }
}

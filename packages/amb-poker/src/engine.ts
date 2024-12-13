import { Model, Scenario, isCard, allCards, Value, Card } from "./model";
import { compileCell } from "./compiler";
import { bestHand, cardRank, PokerHand } from "./handEvaluation";

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

class InvalidScenarioError {}

export class Engine {
  readonly compiledModel: CompiledModel;
  readonly callback: (s: Scenario) => void;

  constructor(model: Model, callback: (result: Scenario) => void) {
    this.compiledModel = compile(model);
    this.callback = callback;
  }

  next(): Scenario {
    while (true) {
      try {
        return this._next();
      } catch (e) {
        if (!(e instanceof InvalidScenarioError)) {
          throw e;
        }
        console.log("boom");
      }
    }
  }

  private _next() {
    // this is the state that makes deal() work
    this.$remainingCards = allCards.slice();

    // For each cell in the model
    const scenario: Scenario = {};
    // TODO: properly manage dependency order, don't just execute in order of cell definition
    for (const cell of this.compiledModel.cells) {
      scenario[cell.name] =
        cell.fn instanceof Function ? cell.fn.call(this, scenario) : cell.fn;
    }

    this.callback(scenario);
    return scenario;
  }

  // arithmetic operators

  "$+"(x: Value, y: Value) {
    if (typeof x === "number" && typeof y === "number") {
      return x + y;
    } else if (typeof x === "string" && typeof y === "string") {
      return x + y;
    } else {
      throw new Error("operand + used with invalid operands");
    }
  }

  "$-"(x: Value, y: Value) {
    if (typeof x === "number" && typeof y === "number") {
      return x - y;
    } else {
      throw new Error("operand - used with invalid operands");
    }
  }

  "$*"(x: Value, y: Value) {
    if (typeof x === "number" && typeof y === "number") {
      return x * y;
    } else {
      throw new Error("operand * used with invalid operands");
    }
  }

  "$/"(x: Value, y: Value) {
    if (typeof x === "number" && typeof y === "number") {
      return x / y;
    } else {
      throw new Error("operand / used with invalid operands");
    }
  }

  // relational operators

  "$="(x: Value, y: Value) {
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
  }

  "$<>"(x: Value, y: Value) {
    return !this["$="](x, y);
  }

  "$>="(x: Value, y: Value) {
    return this["$<"](y, x);
  }

  "$>"(x: Value, y: Value) {
    return this["$>="](x, y) && !this["$="](x, y);
  }

  "$<="(x: Value, y: Value) {
    return this["$<"](x, y) || this["$="](x, y);
  }

  "$<"(x: Value, y: Value) {
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
  }

  // boolean functions

  $and(...xs: Value[]) {
    return xs.reduce((acc, x) => acc && !!x, true);
  }

  $or(...xs: Value[]) {
    return xs.reduce((acc, x) => acc || !!x, false);
  }

  $not(x: Value) {
    return !x;
  }

  // card and hand functions

  $remainingCards: Card[] = [];
  $deal = (card: Value = "?") => {
    if (this.$remainingCards.length === 0) {
      throw new InvalidScenarioError();
    }

    let idx: number;
    if (card === "?") {
      // pick one at random
      idx = Math.floor(Math.random() * this.$remainingCards.length);
    } else {
      idx = this.$remainingCards.indexOf(card as Card);
      if (idx < 0) {
        // can't deal a card that's already been dealt
        throw new InvalidScenarioError();
      }
    }

    const dealtCard = this.$remainingCards[idx];
    this.$remainingCards[idx] = this.$remainingCards.pop()!;
    return dealtCard;
  };

  $bestHand(...cards: Card[]) {
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
  }

  $beats(hand1: PokerHand, hand2: PokerHand) {
    return hand1.beats(hand2);
  }

  $handType(hand: PokerHand) {
    return hand.type;
  }

  $cardRank(card: Card) {
    return cardRank(card);
  }
}

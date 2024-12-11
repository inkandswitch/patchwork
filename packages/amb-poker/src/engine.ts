import { Model, Scenario, isCard, allCards } from "./model";

export class Engine {
  model: Model;
  callback: (scenario: Scenario) => void;

  constructor(model: Model, callback: (result: Scenario) => void) {
    this.model = model;
    this.callback = callback;
  }

  next() {
    const scenario: Scenario = {};
    const availableCards = allCards.filter(
      (c) => !Object.values(this.model.cells).includes(c)
    );
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
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        scenario[cellName] = availableCards[randomIndex];
        availableCards.splice(randomIndex, 1);
      }
    }

    this.model.addComputedValues(scenario);

    this.callback(scenario);
    return scenario;
  }
}

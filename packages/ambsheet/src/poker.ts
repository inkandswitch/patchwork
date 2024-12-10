const deal = (() => {
  const cards = [...]
  return (card) => {
    // if no card arg...
    // return an amb card and remember you removed a card
    // returns a lazy generator of unclaimed cards

    // if card arg...
    // return that card and remember you removed a card
  }
})()

const model = {
  cards: {
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
    valueOfMyHand: (sheet) => {
      const myHand = [...sheet.eval("myHoleCards"), ...sheet.eval("communityCards")]
      /// ...  stuff ...
      return new HandQuality({ type: "pair", value: 7 })
    },
    valueOfTheirHand: (sheet) => {
      const theirHand = [...sheet.eval("theirHoleCards"), ...sheet.eval("communityCards")]
      /// ...  stuff ...
      return new HandQuality({ type: "pair", value: 7 })
    },
    iWin: (sheet) => {
      return HandQuality.greaterThan(sheet.eval("valueOfMyHand"), sheet.eval("valueOfTheirHand"))
    }
    myHoleCards: (sheet) => {
      return [sheet.eval("myCard1"), sheet.eval("myCard2")]
    },
    theirHoleCards: (sheet) => {
      return [sheet.eval("theirCard1"), sheet.eval("theirCard2")]
    },
    communityCards: (sheet) => {
      return [sheet.eval("communityCard1"), sheet.eval("communityCard2"), sheet.eval("communityCard3"), sheet.eval("communityCard4"), sheet.eval("communityCard5")]
    }
  }
};

const savedResults = []
const engine = new Engine(model, (result) => savedResults.push(result))

engine.cardinality() // => 1326
engine.cardinality("iWin") // => 450
const winningPercentage = engine.cardinality("iWin") / engine.cardinality() // => 0.3386
engine.value("iWin") = [{value: true, context: { ... }}, ... ]

while (true) {
  engine.crank(10) // todo: crank with a specific predicate
  console.log(savedResults.length)
}

type Value = string  | number

type Scenario = {
  [key: string]: Value
}

engine.evalFormula("iWin", scenario)

class Result {
  context() {}
  formula(name) {}
}

// notes
// lazy generators don't need to be fully evaluated
// they keep track of how many values they have left to generate (if finite)
import { Card, Rank } from "./poker";

const cardRank = (card: Card): number => {
  const rankMap: Record<Rank, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  return rankMap[card[0] as Rank];
};

// Helper function to check if ranks form a straight
const isStraightRanks = (sortedRanks: Rank[]): boolean => {
  const rankValues = sortedRanks.map((r) => cardRank((r + "S") as Card)); // Suit doesn't matter for rank comparison

  // Special case for Ace-low straight (A,2,3,4,5)
  if (
    rankValues[0] === 14 && // Ace
    rankValues[1] === 5 &&
    rankValues[2] === 4 &&
    rankValues[3] === 3 &&
    rankValues[4] === 2
  ) {
    return true;
  }

  // Normal straight check
  for (let i = 1; i < rankValues.length; i++) {
    if (rankValues[i - 1] !== rankValues[i] + 1) {
      return false;
    }
  }
  return true;
};

const orderedHandTypes = [
  "high-card",
  "pair",
  "two-pair",
  "three-of-a-kind",
  "straight",
  "flush",
  "full-house",
  "four-of-a-kind",
  "straight-flush",
] as const;

const getCombinations = (arr: Card[], size: number): Card[][] => {
  if (size === 1) return arr.map((x) => [x]);

  const result: Card[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const combinations = getCombinations(arr.slice(i + 1), size - 1);
    combinations.forEach((combination) => {
      result.push([arr[i], ...combination]);
    });
  }
  return result;
};

/**
 * Given 5 or more cards, returns the best possible 5-card poker hand
 */
export const bestHand = (cards: Card[]): PokerHand => {
  if (cards.length < 5) {
    throw new Error("Must provide at least 5 cards");
  }

  // Generate all possible 5-card combinations
  let bestHand: PokerHand | null = null;

  // Get all 5-card combinations
  const combinations = getCombinations(cards, 5);

  // Evaluate each combination and keep track of the best
  combinations.forEach((combo) => {
    // Try each hand type in order from highest to lowest
    let hand: PokerHand | null = null;
    for (const HandClass of [...orderedHandClasses].reverse()) {
      const detected = HandClass.detect(combo);
      if (detected) {
        hand = detected;
        break;
      }
    }

    if (!hand) {
      throw new Error("Could not evaluate hand");
    }

    if (!bestHand || hand.beats(bestHand)) {
      bestHand = hand;
    }
  });

  if (!bestHand) {
    throw new Error("Could not find best hand");
  }

  return bestHand;
};

export abstract class PokerHand {
  abstract readonly type: string;
  protected cards: Card[];

  constructor(cards: Card[]) {
    this.cards = cards;
  }

  /** Given two hands, does this hand beat the other? */
  beats(other: PokerHand): boolean {
    const rank1 = orderedHandTypes.findIndex((t) => this.type === t);
    const rank2 = orderedHandTypes.findIndex((t) => other.type === t);

    if (rank1 !== rank2) {
      return rank1 > rank2;
    }

    return this.beatsSameType(other as this);
  }

  /** Does this hand beat another hand of the same type? */
  abstract beatsSameType(other: this): boolean;

  /** Given some cards, detect the best hand that can be made of this type */
  static detect(cards: Card[]): PokerHand | false {
    throw new Error("Not implemented");
  }
}

class HighCardHand extends PokerHand {
  readonly type = "high-card";
  protected cards: Card[];

  constructor(cards: Card[]) {
    super(cards);
    this.cards = [...cards].sort((a, b) => cardRank(b) - cardRank(a));
  }

  static detect(cards: Card[]): HighCardHand {
    return new HighCardHand(cards);
  }

  beatsSameType(other: HighCardHand): boolean {
    for (let i = 0; i < this.cards.length; i++) {
      const rank1 = cardRank(this.cards[i]);
      const rank2 = cardRank(other.cards[i]);
      if (rank1 !== rank2) return rank1 > rank2;
    }
    return false;
  }
}

class OnePairHand extends PokerHand {
  readonly type = "pair";
  private pair: Card;
  private kickers: Card[];

  constructor(cards: Card[], pair: Card, kickers: Card[]) {
    super(cards);
    this.pair = pair;
    this.kickers = kickers;
  }

  static detect(cards: Card[]): OnePairHand | false {
    const ranks = cards.map((c) => c[0]);
    const rankCounts = new Map<string, number>();
    for (const rank of ranks) {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    }

    const pair = [...rankCounts.entries()].find(([_, count]) => count === 2);

    if (!pair) return false;

    const pairCard = cards.find((c) => c[0] === pair[0])!;
    const kickers = cards
      .filter((c) => c[0] !== pair[0])
      .sort((a, b) => cardRank(b) - cardRank(a));

    return new OnePairHand(cards, pairCard, kickers);
  }

  beatsSameType(other: OnePairHand): boolean {
    const pairRank1 = cardRank(this.pair);
    const pairRank2 = cardRank(other.pair);
    if (pairRank1 !== pairRank2) return pairRank1 > pairRank2;

    for (let i = 0; i < this.kickers.length; i++) {
      const rank1 = cardRank(this.kickers[i]);
      const rank2 = cardRank(other.kickers[i]);
      if (rank1 !== rank2) return rank1 > rank2;
    }
    return false;
  }
}

class TwoPairHand extends PokerHand {
  readonly type = "two-pair";
  private highPair: Card;
  private lowPair: Card;
  private kicker: Card;

  constructor(cards: Card[], highPair: Card, lowPair: Card, kicker: Card) {
    super(cards);
    this.highPair = highPair;
    this.lowPair = lowPair;
    this.kicker = kicker;
  }

  static detect(cards: Card[]): TwoPairHand | false {
    const ranks = cards.map((c) => c[0]);
    const rankCounts = new Map<string, number>();
    for (const rank of ranks) {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    }

    const pairs = [...rankCounts.entries()]
      .filter(([_, count]) => count === 2)
      .sort(([rankA], [rankB]) => {
        const cardA = (rankA + "S") as Card;
        const cardB = (rankB + "S") as Card;
        return cardRank(cardB) - cardRank(cardA);
      });

    if (pairs.length !== 2) return false;

    const highPairCard = cards.find((c) => c[0] === pairs[0][0])!;
    const lowPairCard = cards.find((c) => c[0] === pairs[1][0])!;
    const kicker = cards.find(
      (c) => c[0] !== pairs[0][0] && c[0] !== pairs[1][0]
    )!;

    return new TwoPairHand(cards, highPairCard, lowPairCard, kicker);
  }

  beatsSameType(other: TwoPairHand): boolean {
    const highPairRank1 = cardRank(this.highPair);
    const highPairRank2 = cardRank(other.highPair);
    if (highPairRank1 !== highPairRank2) return highPairRank1 > highPairRank2;

    const lowPairRank1 = cardRank(this.lowPair);
    const lowPairRank2 = cardRank(other.lowPair);
    if (lowPairRank1 !== lowPairRank2) return lowPairRank1 > lowPairRank2;

    return cardRank(this.kicker) > cardRank(other.kicker);
  }
}

class ThreeOfAKindHand extends PokerHand {
  readonly type = "three-of-a-kind";
  private three: Card;
  private kickers: Card[];

  constructor(cards: Card[], three: Card, kickers: Card[]) {
    super(cards);
    this.three = three;
    this.kickers = kickers;
  }

  static detect(cards: Card[]): ThreeOfAKindHand | false {
    const ranks = cards.map((c) => c[0]);
    const rankCounts = new Map<string, number>();
    for (const rank of ranks) {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    }

    const three = [...rankCounts.entries()].find(([_, count]) => count === 3);

    if (!three) return false;

    const threeCard = cards.find((c) => c[0] === three[0])!;
    const kickers = cards
      .filter((c) => c[0] !== three[0])
      .sort((a, b) => cardRank(b) - cardRank(a));

    return new ThreeOfAKindHand(cards, threeCard, kickers);
  }

  beatsSameType(other: ThreeOfAKindHand): boolean {
    const threeRank1 = cardRank(this.three);
    const threeRank2 = cardRank(other.three);
    if (threeRank1 !== threeRank2) return threeRank1 > threeRank2;

    for (let i = 0; i < this.kickers.length; i++) {
      const rank1 = cardRank(this.kickers[i]);
      const rank2 = cardRank(other.kickers[i]);
      if (rank1 !== rank2) return rank1 > rank2;
    }
    return false;
  }
}

class StraightHand extends PokerHand {
  readonly type = "straight";
  private highCard: Card;

  constructor(cards: Card[], highCard: Card) {
    super(cards);
    this.highCard = highCard;
  }

  static detect(cards: Card[]): StraightHand | false {
    const sortedCards = [...cards].sort((a, b) => cardRank(b) - cardRank(a));
    const ranks = sortedCards.map((c) => c[0] as Rank);

    if (!isStraightRanks(ranks)) return false;

    return new StraightHand(cards, sortedCards[0]);
  }

  beatsSameType(other: StraightHand): boolean {
    return cardRank(this.highCard) > cardRank(other.highCard);
  }
}

class FlushHand extends PokerHand {
  readonly type = "flush";
  protected cards: Card[];

  constructor(cards: Card[]) {
    super(cards);
    this.cards = [...cards].sort((a, b) => cardRank(b) - cardRank(a));
  }

  static detect(cards: Card[]): FlushHand | false {
    const suits = cards.map((c) => c[1]);
    const isFlush = suits.every((suit) => suit === suits[0]);

    if (!isFlush) return false;

    return new FlushHand(cards);
  }

  beatsSameType(other: FlushHand): boolean {
    for (let i = 0; i < this.cards.length; i++) {
      const rank1 = cardRank(this.cards[i]);
      const rank2 = cardRank(other.cards[i]);
      if (rank1 !== rank2) return rank1 > rank2;
    }
    return false;
  }
}

class FullHouseHand extends PokerHand {
  readonly type = "full-house";
  private three: Card;
  private pair: Card;

  constructor(cards: Card[], three: Card, pair: Card) {
    super(cards);
    this.three = three;
    this.pair = pair;
  }

  static detect(cards: Card[]): FullHouseHand | false {
    const ranks = cards.map((c) => c[0]);
    const rankCounts = new Map<string, number>();
    for (const rank of ranks) {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    }

    const three = [...rankCounts.entries()].find(([_, count]) => count === 3);
    const pair = [...rankCounts.entries()].find(([_, count]) => count === 2);

    if (!three || !pair) return false;

    const threeCard = cards.find((c) => c[0] === three[0])!;
    const pairCard = cards.find((c) => c[0] === pair[0])!;

    return new FullHouseHand(cards, threeCard, pairCard);
  }

  beatsSameType(other: FullHouseHand): boolean {
    const threeRank1 = cardRank(this.three);
    const threeRank2 = cardRank(other.three);
    if (threeRank1 !== threeRank2) return threeRank1 > threeRank2;

    return cardRank(this.pair) > cardRank(other.pair);
  }
}

class FourOfAKindHand extends PokerHand {
  readonly type = "four-of-a-kind";
  private four: Card;
  private kicker: Card;

  constructor(cards: Card[], four: Card, kicker: Card) {
    super(cards);
    this.four = four;
    this.kicker = kicker;
  }

  static detect(cards: Card[]): FourOfAKindHand | false {
    const ranks = cards.map((c) => c[0]);
    const rankCounts = new Map<string, number>();
    for (const rank of ranks) {
      rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
    }

    const four = [...rankCounts.entries()].find(([_, count]) => count === 4);

    if (!four) return false;

    const fourCard = cards.find((c) => c[0] === four[0])!;
    const kicker = cards.find((c) => c[0] !== four[0])!;

    return new FourOfAKindHand(cards, fourCard, kicker);
  }

  beatsSameType(other: FourOfAKindHand): boolean {
    const fourRank1 = cardRank(this.four);
    const fourRank2 = cardRank(other.four);
    if (fourRank1 !== fourRank2) return fourRank1 > fourRank2;

    return cardRank(this.kicker) > cardRank(other.kicker);
  }
}

class StraightFlushHand extends PokerHand {
  readonly type = "straight-flush";
  private highCard: Card;

  constructor(cards: Card[], highCard: Card) {
    super(cards);
    this.highCard = highCard;
  }

  static detect(cards: Card[]): StraightFlushHand | false {
    const suits = cards.map((c) => c[1]);
    const isFlush = suits.every((suit) => suit === suits[0]);

    if (!isFlush) return false;

    const sortedCards = [...cards].sort((a, b) => cardRank(b) - cardRank(a));
    const ranks = sortedCards.map((c) => c[0] as Rank);

    if (!isStraightRanks(ranks)) return false;

    return new StraightFlushHand(cards, sortedCards[0]);
  }

  beatsSameType(other: StraightFlushHand): boolean {
    return cardRank(this.highCard) > cardRank(other.highCard);
  }
}

// we define this down here so that we're done defining all the hand classes before we do this
const orderedHandClasses = [
  HighCardHand,
  OnePairHand,
  TwoPairHand,
  ThreeOfAKindHand,
  StraightHand,
  FlushHand,
  FullHouseHand,
  FourOfAKindHand,
  StraightFlushHand,
] as const;

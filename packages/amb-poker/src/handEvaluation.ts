import { Card, Rank } from "./model";

const cardRankMap: Record<Rank, number> = {
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

const cardRank = (card: Card) => cardRankMap[card[0] as Rank];

const handTypeRankMap: Record<string, number> = {
  "high-card": 1,
  pair: 2,
  "two-pair": 3,
  "three-of-a-kind": 4,
  straight: 5,
  flush: 6,
  "full-house": 7,
  "four-of-a-kind": 8,
  "straight-flush": 9,
};

const handRank = (type: string) => handTypeRankMap[type];

// Helper function to check if ranks form a straight
const isStraightCards = (sortedCards: Card[]): boolean => {
  // Special case for Ace-low straight (A,2,3,4,5)
  if (
    cardRank(sortedCards[0]) === 14 && // Ace
    cardRank(sortedCards[1]) === 5 &&
    cardRank(sortedCards[2]) === 4 &&
    cardRank(sortedCards[3]) === 3 &&
    cardRank(sortedCards[4]) === 2
  ) {
    return true;
  }

  // Normal straight check
  for (let i = 1; i < sortedCards.length; i++) {
    if (cardRank(sortedCards[i - 1]) !== cardRank(sortedCards[i]) + 1) {
      return false;
    }
  }
  return true;
};

const handTypesOrderedWorstToBest = [
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
    for (const HandClass of handClassesOrderedBestToWorst) {
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
  protected readonly cards: Card[];

  constructor(cards: Card[]) {
    this.cards = cards;
  }

  /** Given two hands, does this hand beat the other? */
  beats(other: PokerHand): boolean {
    const rank1 = handRank(this.type);
    const rank2 = handRank(other.type);

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

  getCards(): Card[] {
    return this.cards;
  }
}

export class HighCardHand extends PokerHand {
  readonly type = "high-card";

  constructor(cards: Card[]) {
    super([...cards].sort((a, b) => cardRank(b) - cardRank(a)));
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

export class OnePairHand extends PokerHand {
  readonly type = "pair";
  readonly pairCards: [Card, Card];
  readonly kickers: Card[];

  constructor(cards: Card[], pairCards: [Card, Card], kickers: Card[]) {
    super(cards);
    this.pairCards = pairCards;
    this.kickers = kickers;
  }

  static detect(cards: Card[]): OnePairHand | false {
    const ranks = cards.map((c) => c[0]);
    const rankCounts = new Map<string, number>();
    for (const rank of ranks) {
      rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
    }

    const pair = [...rankCounts.entries()].find(([_, count]) => count === 2);

    if (!pair) return false;

    const pairCards = cards.filter((c) => c[0] === pair[0]) as [Card, Card];
    const kickers = cards
      .filter((c) => c[0] !== pair[0])
      .sort((a, b) => cardRank(b) - cardRank(a));

    return new OnePairHand(cards, pairCards, kickers);
  }

  beatsSameType(other: OnePairHand): boolean {
    const pairRank1 = cardRank(this.pairCards[0]);
    const pairRank2 = cardRank(other.pairCards[0]);
    if (pairRank1 !== pairRank2) return pairRank1 > pairRank2;

    for (let i = 0; i < this.kickers.length; i++) {
      const rank1 = cardRank(this.kickers[i]);
      const rank2 = cardRank(other.kickers[i]);
      if (rank1 !== rank2) return rank1 > rank2;
    }
    return false;
  }
}

export class TwoPairHand extends PokerHand {
  readonly type = "two-pair";
  readonly highPairCards: [Card, Card];
  readonly lowPairCards: [Card, Card];
  readonly kicker: Card;

  constructor(
    cards: Card[],
    highPairCards: [Card, Card],
    lowPairCards: [Card, Card],
    kicker: Card
  ) {
    super(cards);
    this.highPairCards = highPairCards;
    this.lowPairCards = lowPairCards;
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

    const highPairCards = cards.filter((c) => c[0] === pairs[0][0]) as [
      Card,
      Card
    ];
    const lowPairCards = cards.filter((c) => c[0] === pairs[1][0]) as [
      Card,
      Card
    ];
    const kicker = cards.find(
      (c) => c[0] !== pairs[0][0] && c[0] !== pairs[1][0]
    )!;

    return new TwoPairHand(cards, highPairCards, lowPairCards, kicker);
  }

  beatsSameType(other: TwoPairHand): boolean {
    const highPairRank1 = cardRank(this.highPairCards[0]);
    const highPairRank2 = cardRank(other.highPairCards[0]);
    if (highPairRank1 !== highPairRank2) return highPairRank1 > highPairRank2;

    const lowPairRank1 = cardRank(this.lowPairCards[0]);
    const lowPairRank2 = cardRank(other.lowPairCards[0]);
    if (lowPairRank1 !== lowPairRank2) return lowPairRank1 > lowPairRank2;

    return cardRank(this.kicker) > cardRank(other.kicker);
  }
}

export class ThreeOfAKindHand extends PokerHand {
  readonly type = "three-of-a-kind";
  readonly threeCards: [Card, Card, Card];
  readonly kickers: [Card, Card];

  constructor(
    cards: Card[],
    threeCards: [Card, Card, Card],
    kickers: [Card, Card]
  ) {
    super(cards);
    this.threeCards = threeCards;
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

    const threeCards = cards.filter((c) => c[0] === three[0]) as [
      Card,
      Card,
      Card
    ];
    const kickers = cards
      .filter((c) => c[0] !== three[0])
      .sort((a, b) => cardRank(b) - cardRank(a)) as [Card, Card];

    return new ThreeOfAKindHand(cards, threeCards, kickers);
  }

  beatsSameType(other: ThreeOfAKindHand): boolean {
    const threeRank1 = cardRank(this.threeCards[0]);
    const threeRank2 = cardRank(other.threeCards[0]);
    if (threeRank1 !== threeRank2) return threeRank1 > threeRank2;

    for (let i = 0; i < this.kickers.length; i++) {
      const rank1 = cardRank(this.kickers[i]);
      const rank2 = cardRank(other.kickers[i]);
      if (rank1 !== rank2) return rank1 > rank2;
    }
    return false;
  }
}

export class StraightHand extends PokerHand {
  readonly type = "straight";
  private readonly highCard: Card;

  constructor(cards: Card[], highCard: Card) {
    super(cards);
    this.highCard = highCard;
  }

  static detect(cards: Card[]): StraightHand | false {
    const sortedCards = [...cards].sort((a, b) => cardRank(b) - cardRank(a));
    return isStraightCards(sortedCards)
      ? new StraightHand(cards, sortedCards[0])
      : false;
  }

  beatsSameType(other: StraightHand): boolean {
    return cardRank(this.highCard) > cardRank(other.highCard);
  }
}

export class FlushHand extends PokerHand {
  readonly type = "flush";

  constructor(cards: Card[]) {
    super([...cards].sort((a, b) => cardRank(b) - cardRank(a)));
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

export class FullHouseHand extends PokerHand {
  readonly type = "full-house";
  readonly threeCards: [Card, Card, Card];
  readonly pairCards: [Card, Card];

  constructor(
    cards: Card[],
    threeCards: [Card, Card, Card],
    pairCards: [Card, Card]
  ) {
    super(cards);
    this.threeCards = threeCards;
    this.pairCards = pairCards;
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

    const threeCards = cards.filter((c) => c[0] === three[0]) as [
      Card,
      Card,
      Card
    ];
    const pairCards = cards.filter((c) => c[0] === pair[0]) as [Card, Card];

    return new FullHouseHand(cards, threeCards, pairCards);
  }

  beatsSameType(other: FullHouseHand): boolean {
    const threeRank1 = cardRank(this.threeCards[0]);
    const threeRank2 = cardRank(other.threeCards[0]);
    if (threeRank1 !== threeRank2) return threeRank1 > threeRank2;

    return cardRank(this.pairCards[0]) > cardRank(other.pairCards[0]);
  }
}

export class FourOfAKindHand extends PokerHand {
  readonly type = "four-of-a-kind";
  readonly fourCards: [Card, Card, Card, Card];
  readonly kicker: Card;

  constructor(
    cards: Card[],
    fourCards: [Card, Card, Card, Card],
    kicker: Card
  ) {
    super(cards);
    this.fourCards = fourCards;
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

    const fourCards = cards.filter((c) => c[0] === four[0]) as [
      Card,
      Card,
      Card,
      Card
    ];
    const kicker = cards.find((c) => c[0] !== four[0])!;

    return new FourOfAKindHand(cards, fourCards, kicker);
  }

  beatsSameType(other: FourOfAKindHand): boolean {
    const fourRank1 = cardRank(this.fourCards[0]);
    const fourRank2 = cardRank(other.fourCards[0]);
    if (fourRank1 !== fourRank2) return fourRank1 > fourRank2;

    return cardRank(this.kicker) > cardRank(other.kicker);
  }
}

export class StraightFlushHand extends PokerHand {
  readonly type = "straight-flush";
  private readonly highCard: Card;

  constructor(cards: Card[], highCard: Card) {
    super(cards);
    this.highCard = highCard;
  }

  static detect(cards: Card[]): StraightFlushHand | false {
    const suits = cards.map((c) => c[1]);
    const isFlush = suits.every((suit) => suit === suits[0]);

    if (!isFlush) return false;

    const sortedCards = [...cards].sort((a, b) => cardRank(b) - cardRank(a));
    return isStraightCards(sortedCards)
      ? new StraightFlushHand(cards, sortedCards[0])
      : false;
  }

  beatsSameType(other: StraightFlushHand): boolean {
    return cardRank(this.highCard) > cardRank(other.highCard);
  }
}

// we define this down here so that we're done defining all the hand classes before we do this
const handClassesOrderedBestToWorst = [
  StraightFlushHand,
  FourOfAKindHand,
  FullHouseHand,
  FlushHand,
  StraightHand,
  ThreeOfAKindHand,
  TwoPairHand,
  OnePairHand,
  HighCardHand,
] as const;

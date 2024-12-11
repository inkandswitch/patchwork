import React from "react";
import { CardComponent } from "./Card";
import {
  PokerHand,
  HighCardHand,
  OnePairHand,
  TwoPairHand,
  ThreeOfAKindHand,
  StraightHand,
  FlushHand,
  FullHouseHand,
  FourOfAKindHand,
  StraightFlushHand,
} from "../handEvaluation";

interface HandProps {
  hand: PokerHand;
}

export const Hand: React.FC<HandProps> = ({ hand }) => {
  if (hand instanceof HighCardHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">High Card</div>
        <div className="flex gap-2">
          {hand.getCards().map((card, i) => (
            <CardComponent key={i} card={card} />
          ))}
        </div>
      </div>
    );
  }

  if (hand instanceof OnePairHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Pair</div>
        <div className="flex gap-2">
          <div className="border rounded p-1 flex gap-1">
            {hand.pairCards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
          {hand.kickers.map((card, i) => (
            <CardComponent key={i} card={card} />
          ))}
        </div>
      </div>
    );
  }

  if (hand instanceof TwoPairHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Two Pair</div>
        <div className="flex gap-2">
          <div className="border rounded p-1 flex gap-1">
            {hand.highPairCards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
          <div className="border rounded p-1 flex gap-1">
            {hand.lowPairCards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
          <CardComponent card={hand.kicker} />
        </div>
      </div>
    );
  }

  if (hand instanceof ThreeOfAKindHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Three of a Kind</div>
        <div className="flex gap-2">
          <div className="border rounded p-1 flex gap-1">
            {(() => {
              console.log("three cards", hand.threeCards);
              return null;
            })()}
            {hand.threeCards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
          {hand.kickers.map((card, i) => (
            <CardComponent key={i} card={card} />
          ))}
        </div>
      </div>
    );
  }

  if (hand instanceof StraightHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Straight</div>
        <div className="flex gap-2">
          {hand.getCards().map((card, i) => (
            <CardComponent key={i} card={card} />
          ))}
        </div>
      </div>
    );
  }

  if (hand instanceof FlushHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Flush</div>
        <div className="flex gap-2">
          {hand.getCards().map((card, i) => (
            <CardComponent key={i} card={card} />
          ))}
        </div>
      </div>
    );
  }

  if (hand instanceof FullHouseHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Full House</div>
        <div className="flex gap-2">
          <div className="border rounded p-1 flex gap-1">
            {hand.threeCards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
          <div className="border rounded p-1 flex gap-1">
            {hand.pairCards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hand instanceof FourOfAKindHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Four of a Kind</div>
        <div className="flex gap-2">
          <div className="border rounded p-1 flex gap-1">
            {hand.fourCards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
          <CardComponent card={hand.kicker} />
        </div>
      </div>
    );
  }

  if (hand instanceof StraightFlushHand) {
    return (
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">Straight Flush</div>
        <div className="flex gap-2">
          {hand.getCards().map((card, i) => (
            <CardComponent key={i} card={card} />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

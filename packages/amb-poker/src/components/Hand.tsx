import React from "react";
import { CardComponent } from "./Card";
import { PokerHand } from "../handEvaluation";

interface HandProps {
  hand: PokerHand;
}

export const Hand: React.FC<HandProps> = ({ hand }) => {
  switch (hand.type) {
    case "high-card":
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">High Card</div>
          <div className="flex gap-2">
            {hand.cards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
        </div>
      );

    case "pair":
      const pairHand = hand as any;
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Pair</div>
          <div className="flex gap-2">
            <div className="border rounded p-1">
              <CardComponent card={pairHand.pair} />
            </div>
            {pairHand.kickers.map((card: any, i: number) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
        </div>
      );

    case "two-pair":
      const twoPairHand = hand as any;
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Two Pair</div>
          <div className="flex gap-2">
            <div className="border rounded p-1">
              <CardComponent card={twoPairHand.highPair} />
            </div>
            <div className="border rounded p-1">
              <CardComponent card={twoPairHand.lowPair} />
            </div>
            <CardComponent card={twoPairHand.kicker} />
          </div>
        </div>
      );

    case "three-of-a-kind":
      const threeHand = hand as any;
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Three of a Kind</div>
          <div className="flex gap-2">
            <div className="border rounded p-1">
              <CardComponent card={threeHand.three} />
            </div>
            {threeHand.kickers.map((card: any, i: number) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
        </div>
      );

    case "straight":
      const straightHand = hand as any;
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Straight</div>
          <div className="flex gap-2">
            {hand.cards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
        </div>
      );

    case "flush":
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Flush</div>
          <div className="flex gap-2">
            {hand.cards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
        </div>
      );

    case "full-house":
      const fullHouseHand = hand as any;
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Full House</div>
          <div className="flex gap-2">
            <div className="border rounded p-1">
              <CardComponent card={fullHouseHand.three} />
            </div>
            <div className="border rounded p-1">
              <CardComponent card={fullHouseHand.pair} />
            </div>
          </div>
        </div>
      );

    case "four-of-a-kind":
      const fourHand = hand as any;
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Four of a Kind</div>
          <div className="flex gap-2">
            <div className="border rounded p-1">
              <CardComponent card={fourHand.four} />
            </div>
            <CardComponent card={fourHand.kicker} />
          </div>
        </div>
      );

    case "straight-flush":
      const straightFlushHand = hand as any;
      return (
        <div className="flex flex-col">
          <div className="text-sm text-gray-600">Straight Flush</div>
          <div className="flex gap-2">
            {hand.cards.map((card, i) => (
              <CardComponent key={i} card={card} />
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

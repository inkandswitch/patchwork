import { Card } from "../model";

export const CardComponent: React.FC<{ card: Card }> = ({ card }) => {
  const rank = card[0];
  const suit = card[1];
  const displayRank = rank === "T" ? "10" : rank;
  const suitEmoji =
    {
      H: "♥️",
      D: "♦️",
      C: "♣️",
      S: "♠️",
    }[suit] || suit;

  return (
    <span className="flex items-center gap-1">
      <span>{displayRank}</span>
      <span>{suitEmoji}</span>
    </span>
  );
};

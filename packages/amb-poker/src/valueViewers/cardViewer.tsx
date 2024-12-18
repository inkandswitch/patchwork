import { ValueViewer } from ".";
import { CardViewer } from "../components/Card";
import { Card, isCard } from "../model";
import { uniq } from "lodash-es";

import cardBack from "../card-back.png";

export const cardViewer: ValueViewer = {
  name: "Card",
  shouldRender: ({ scenarios, cellToDisplay }) => {
    if (
      scenarios.length > 0 &&
      scenarios.every((s) => isCard(s[cellToDisplay]))
    ) {
      return "high";
    } else {
      return "hide";
    }
  },
  component: ({ scenarios, cellToDisplay }) => {
    if (uniq(scenarios.map((s) => s[cellToDisplay])).length > 1) {
      return <img src={cardBack}></img>;
    } else {
      return (
        <div className="bg-white text-black h-[123px] w-[88px] box-border p-6 border border-black rounded-lg">
          <CardViewer card={scenarios[0][cellToDisplay] as Card} />
        </div>
      );
    }
  },
};

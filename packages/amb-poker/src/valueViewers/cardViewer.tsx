import { ValueViewer } from ".";
import { CardViewer } from "../components/Card";
import { Card, isCard } from "../model";
import { uniq } from "lodash-es";

import cardBack from "../card-back.png";

export const cardViewer: ValueViewer = {
  name: "Card",
  shouldRender: (values) => {
    if (values.length > 0 && values.every((v) => isCard(v.value))) {
      return "high";
    } else {
      return "hide";
    }
  },
  component: ({ values }) => {
    if (uniq(values.map((v) => v.value)).length > 1) {
      return <img src={cardBack}></img>;
    } else {
      return (
        <div className="h-[123px] w-[88px] box-border p-6 border border-black rounded-lg">
          <CardViewer card={values[0].value as Card} />
        </div>
      );
    }
  },
};

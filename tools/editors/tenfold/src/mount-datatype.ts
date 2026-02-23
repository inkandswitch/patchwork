import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Tenfold, TenfoldState } from "./index.tsx";

export default {
  init(doc: Tenfold) {
    const states: TenfoldState[] = [];
    for (let i = 0; i < 9; i++) {
      let s = (states[i] = {} as TenfoldState);
      s.i = 0;
      s.q = i / 4 - 1;
      s.r = (Math.random() - 0.5) / 5;
      s.x = 0;
      s.y = 0;
    }

    Object.assign(doc, {
      name: Array.from("Tenfold")
        .sort(() => Math.random() - 0.5)
        .join(""),
      states,
      editing: null,
      tenfolder: "automerge:2c4E6m5u6rPWkeDxA6i1YWrAjTzD" as AutomergeUrl,
    } satisfies Tenfold);
  },
  getTitle(doc: Tenfold) {
    return doc.name;
  },
  setTitle(doc: Tenfold, name: string) {
    doc.name = name;
  },
};

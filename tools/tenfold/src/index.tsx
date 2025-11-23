// todo remove when we are doing the right thing re: module loading from within system
import "./index.css";
import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import {
  type LoadableDataType,
  type LoadablePlugin,
  type ToolDescription,
  type ToolImplementation,
} from "@patchwork/plugins";
import { render } from "solid-js/web";

export type TenfoldLetterer = (
  q: number,
  r: number,
  t: number,
  x: number,
  y: number
) => void;

export type TenfoldLetters = TenfoldLetterer[][];

export type TenfoldLettersDoc = { letters: string[][] };

/* function addStyles(
  textContent: string,
  element: HTMLElement = self.document?.head
) {
  const id = "tenfold-styles";
  const el = element.querySelector(`#${id}`) ?? document.createElement("style");
  Object.assign(el, { textContent, id });
  element.append(el);
}

async function loadStyles() {
  const url = new URL("./tenfold.css", import.meta.url);
  return (await fetch(url)).text();
} */

export interface TenfoldState {
  /** letter index */
  i: number;
  /** waffle x */
  q: number;
  /** waffle y */
  r: number;
  /** kaoss x */
  x: number;
  /** kaoss y */
  y: number;
}

export interface Tenfold {
  /** the document's name */
  name: string;
  states: TenfoldState[];
  editing: number | null;
  letters: AutomergeUrl;
}

export const plugins = [
  {
    type: "patchwork:datatype",
    id: "inkandswitch/tenfold",
    name: "Tenfold",
    icon: "Grid3x3",
    async load() {
      return {
        init(doc) {
          const states: TenfoldState[] = [];
          for (let i = 0; i < 9; i++) {
            let s = (states[i] = {} as TenfoldState);
            s.i = 0;
            s.q = i / 4 - 1;
            s.r = 0;
            s.x = 0;
            s.y = 0;
          }

          Object.assign(doc, {
            name: Array.from("Tenfold")
              .sort(() => Math.random() - 0.5)
              .join(""),
            states,
            letters: "automerge:3ChURbS7DwKPfM6g8dMM3RszrPA5" as AutomergeUrl,
            editing: null,
          } satisfies Tenfold);
        },
        getTitle(doc) {
          return doc.name;
        },
        setTitle(doc, name) {
          doc.name = name;
        },
      };
    },
  } satisfies LoadableDataType<Tenfold>,
  {
    type: "patchwork:tool",
    id: "inkandswitch/tenfold",
    name: "Tenfold",
    supportedDataTypes: ["inkandswitch/tenfold"],
    async load() {
      //const styles = await loadStyles();
      //addStyles(styles);
      const tool = await import("./tool.tsx");
      return (handle, element) => {
        return render(
          () => (
            <tool.default
              handle={handle as DocHandle<Tenfold>}
              element={element}
            />
          ),
          element
        );
      };
    },
  } satisfies LoadablePlugin<ToolDescription, ToolImplementation>,
];

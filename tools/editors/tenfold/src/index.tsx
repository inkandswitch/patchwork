import "./index.css";
import type { AutomergeUrl } from "@automerge/automerge-repo";

export type TenfoldLetterer = (
  q: number,
  r: number,
  t: number,
  x: number,
  y: number
) => void;

export type TenfoldLetters = TenfoldLetterer[][];

export type TenfoldLettersDoc = { letters: string[][] };

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
  // deprecated
  letters?: AutomergeUrl;
  tenfolder: AutomergeUrl;
}

export const plugins = [
  {
    type: "patchwork:datatype",
    id: "inkandswitch/tenfold",
    name: "Tenfold",
    icon: "Grid3x3",
    importPath: "./dist/mount-datatype.js",
  },
  {
    type: "patchwork:tool",
    id: "inkandswitch/tenfold",
    name: "Tenfold",
    supportedDatatypes: ["inkandswitch/tenfold"],
    importPath: "./dist/mount-tool.js",
  },
  {
    type: "patchwork:tool",
    id: "js-viewer",
    name: "File Viewer (don't @ me)",
    supportedDatatypes: [],
    unlisted: true,
    importPath: "./dist/mount-file-viewer.js",
  },
];

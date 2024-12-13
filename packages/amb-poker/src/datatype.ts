import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { initFrom, type DataType } from "@patchwork/sdk";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { RawValue } from "@patchwork/ambsheet/src/datatype";
import { Filter } from "@patchwork/ambsheet/src/eval";
import { Model } from "./model";
import { SAMPLE_MODEL } from "./model";

// SCHEMA

export type AmbPokerDoc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  model: Model;
};

// FUNCTIONS

export const markCopy = (doc: AmbPokerDoc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: AmbPokerDoc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: AmbPokerDoc) => {
  return doc.title || "AmbPoker";
};

export const init = (doc: AmbPokerDoc) => {
  initFrom(doc, {
    title: "Untitled AmbPoker",
    model: SAMPLE_MODEL,
  });
};

export const datatype: DataType<AmbPokerDoc, unknown> = {
  type: "patchwork:dataType",
  id: "ambPoker",
  name: "Amb Poker",
  icon: "Club",
  isExperimental: true,

  init,
  getTitle,
  setTitle,
  markCopy,
};

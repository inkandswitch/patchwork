import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import {
  DataTypeImplementation,
  initFrom,
  type DataType,
} from "@patchwork/sdk";
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
    // model: SAMPLE_MODEL,
    model: {
      cells: [],
      filters: [],
    },
  });
};

export const dataType: DataTypeImplementation<AmbPokerDoc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};

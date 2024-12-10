import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { initFrom, type DataType } from "@patchwork/sdk";

// SCHEMA

export type CounterDoc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  count: number;
};
// FUNCTIONS

export const markCopy = (doc: CounterDoc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: CounterDoc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: CounterDoc) => {
  return doc.title || "Counter";
};

export const init = (doc: CounterDoc) => {
  initFrom(doc, {
    title: "Untitled Counter",
    count: 0,
  });
};

export const dataType: DataType<CounterDoc, unknown> = {
  type: "patchwork:dataType",
  id: "counter",
  name: "Counter",
  icon: "PlusCircle",

  init,
  getTitle,
  setTitle,
  markCopy,
};

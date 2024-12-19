import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";

// SCHEMA

export interface Doc {
  trace?: {
    stack: any[];
    prog: {
      rules: any[];
      query: any[];
    };
  };
}

// FUNCTIONS

export const markCopy = (doc: Doc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: Doc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: Doc) => {
  return doc.title || "Counter";
};

export const init = (doc: Doc) => {
  initFrom(doc, {
    title: "Untitled Prolog Trace",
  });
};

export const dataType: DataTypeImplementation<Doc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};

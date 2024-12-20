import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import { Annotation } from "@patchwork/sdk/versionControl";

// SCHEMA

export interface TraceDoc {
  title: string;
  trace?: {
    stack: any[];
    prog: {
      rules: any[];
      query: any[];
    };
  };
}

// Simple numeric index anchor type
export type PrologTraceAnchor = {
  step: number;
};

export interface Snapshot {
  stack: any[];
  solution?: any;
  note?: string;
}

// FUNCTIONS

export const markCopy = (doc: TraceDoc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: TraceDoc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: TraceDoc) => {
  return doc.title || "Counter";
};

export const init = (doc: TraceDoc) => {
  initFrom(doc, {
    title: "Untitled Prolog Trace",
  });
};

export const groupAnnotations = (
  annotations: Annotation<PrologTraceAnchor, string>[]
) => {
  return annotations.map((annotation) => [annotation]);
};

export const dataType: DataTypeImplementation<
  TraceDoc,
  PrologTraceAnchor,
  string
> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};

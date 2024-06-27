import { HasVersionControlMetadata } from "@/versionControl/schema";
import { type DataType } from "@/sdk";
import { Heads } from "@automerge/automerge/next";

// SCHEMA

export type JacquardProjectDoc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  fileContents: { [key: string]: { contentType: string; contents: string } };

  // TODO: move build runs metadata out of the doc, because things get weird with heads?
  buildRuns: Array<{
    outputs: string[]; // TODO one output? multiple outputs?
    command: string; // TODO more indirection here to a "task" of some kind?
    inputs: string[];
    inputHeads: Heads;
    timestamp: number;
  }>;
};

// FUNCTIONS

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)
export const markCopy = (doc: JacquardProjectDoc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: JacquardProjectDoc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: JacquardProjectDoc) => {
  return doc.title || "Untitled Project";
};

export const init = (doc: any) => {
  doc.title = "Untitled Project";
  doc.fileContents = {};
  doc.buildRuns = [];
};

export const jacquardProjectDatatype: DataType<
  JacquardProjectDoc,
  never,
  string
> = {
  type: "patchwork:dataType",
  id: "jacquard-project",
  name: "Jacquard Project",
  icon: "Microscope",
  isExperimental: false, // TODO set true before merging?

  init,
  getTitle,
  setTitle,
  markCopy,
};

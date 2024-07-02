import { HasVersionControlMetadata } from "@/versionControl/schema";
import { type DataType } from "@/sdk";
import { Heads } from "@automerge/automerge/next";

// SCHEMA

export type JacquardBuildMetadata = HasVersionControlMetadata<
  unknown,
  unknown
> & {
  title: string;
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
export const markCopy = (doc: JacquardBuildMetadata) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: JacquardBuildMetadata, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: JacquardBuildMetadata) => {
  return doc.title || "Untitled Build Metadata";
};

export const init = (doc: any) => {
  doc.title = "Untitled Project";
  doc.fileContents = {};
  doc.buildRuns = [];
};

export const jacquardBuildMetadataDatatype: DataType<
  JacquardBuildMetadata,
  never,
  string
> = {
  type: "patchwork:dataType",
  id: "jacquard-build-metadata",
  name: "Jacquard Build Metadata",
  icon: "Microscope",
  isExperimental: false, // TODO set true before merging?

  init,
  getTitle,
  setTitle,
  markCopy,
};

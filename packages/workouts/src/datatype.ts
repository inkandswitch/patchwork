import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import { WorkoutDoc } from "./types";

// SCHEMA

export type Doc = HasVersionControlMetadata<unknown, unknown> & WorkoutDoc;

// FUNCTIONS

const markCopy = (doc: Doc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: Doc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: Doc) => {
  return doc.title || "Workout";
};

const init = (doc: Doc) => {
  initFrom(doc, {
    title: "Untitled Workout",
    workouts: [],
    oneRMs: {},
  });
};

export const dataType: DataTypeImplementation<Doc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};

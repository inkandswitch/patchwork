import { HasVersionControlMetadata } from "@/versionControl/schema";
import { noGrouping, type DataType } from "@/sdk";
import { defaultNoopBatch } from "mobx-react-lite/dist/utils/observerBatching";
import { ImageFileViewer, isImageFile } from "./components/ImageFileViewer";

// SCHEMA

export type FileDoc = HasVersionControlMetadata<unknown, unknown> & {
  name: string;
  type: string;
  content: string | Uint8Array;
};

// FUNCTIONS

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)
const markCopy = (doc: FileDoc) => {
  doc.name = "Copy of " + doc.name;
};

const setTitle = async (doc: FileDoc, title: string) => {
  doc.name = title;
};

const getTitle = async (doc: FileDoc) => {
  return doc.name || "Untitled File";
};

export const init = (doc: any) => {
  // todo: should only be able to create this by importing a file
  // or by creating a specific type
  throw new Error("can't create empty file");
};

export const fileDatatype: DataType<FileDoc, never, string> = {
  type: "patchwork:dataType",
  id: "file",
  name: "File",
  icon: "File", // todo: this should be a function, to be type specific
  init,
  getTitle,
  setTitle,
  markCopy,
  // todo: long term we probably want something different but this lets
  // us see each change directly
  groupChanges: noGrouping,

  fallbackSummaryForChangeGroup(changeGroup) {
    const doc = changeGroup.docAtEndOfChangeGroup;

    if (isImageFile(doc)) {
      return <ImageFileViewer doc={doc} />;
    }

    return "changed";
  },
};

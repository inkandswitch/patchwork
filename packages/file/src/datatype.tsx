import { ChangeGroup, noGrouping, type DataType } from "@/sdk";
import { HasVersionControlMetadata } from "@/versionControl/schema";
import { isImageFile, useBinaryUrl } from "./components/ImageFileViewer";

// SCHEMA

export type FileDoc = HasVersionControlMetadata<unknown, unknown> & {
  name: string;
  type: string; // todo: should maybe rename type to extension?
  content: string | Uint8Array;
};

export type TextFileDoc = FileDoc & {
  content: string;
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
    return <ChangeGroupView changeGroup={changeGroup} />;
  },
};

const ChangeGroupView = ({
  changeGroup,
}: {
  changeGroup: ChangeGroup<FileDoc>;
}) => {
  const doc = changeGroup.docAtEndOfChangeGroup;

  if (!isImageFile(doc)) {
    return "changed";
  }

  const binaryUrl = useBinaryUrl(doc?.content as Uint8Array);

  return <img src={binaryUrl} className="w-full h-full object-contain" />;
};

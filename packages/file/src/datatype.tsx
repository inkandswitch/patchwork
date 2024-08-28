import * as Automerge from "@automerge/automerge";
import {
  ChangeGroup,
  DecodedChangeWithMetadata,
  noGrouping,
  type DataType,
} from "@/sdk";
import { HasVersionControlMetadata } from "@/versionControl/schema";
import { isImageFile, useBinaryUrl } from "./components/ImageFileViewer";
import { TextAnchor, textAnchorsAtPath } from "@/lib/textAnchors";
import { pick } from "lodash";
import { TextPatch } from "@/versionControl/utils";

// SCHEMA

export type BinaryFileContent = {
  type: "binary";
  value: Uint8Array;
};

export type TextFileContent = {
  type: "text";
  value: string;
};

export type LinkedFileContent = {
  type: "link";
  url: string;
};

export type FileContent =
  | BinaryFileContent
  | TextFileContent
  | LinkedFileContent;

export type FileDoc = HasVersionControlMetadata<TextAnchor, string> & {
  name: string;
  type: string; // todo: should maybe rename type to extension?
  content: FileContent;
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

const ChangeGroupView = ({
  changeGroup,
}: {
  changeGroup: ChangeGroup<FileDoc>;
}) => {
  const doc = changeGroup.docAtEndOfChangeGroup;
  const binaryUrl = useBinaryUrl(
    doc?.content.type === "binary" ? doc.content.value : undefined
  );

  if (!isImageFile(doc)) {
    return "changed";
  }

  return <img src={binaryUrl} className="w-full h-full object-contain" />;
};

const promptForAIChangeGroupSummary = ({
  docBefore,
  docAfter,
}: {
  docBefore: FileDoc;
  docAfter: FileDoc;
}) => {
  // TODO: refactor so we don't need to call an LLM in this case
  if (docAfter.content.type !== "text") {
    return "Respond with just this text: 'can't summarize non-text changes'";
  }
  return `
Summarize the changes in this diff in a few words.

Only return a few words, not a full description. No bullet points.

Here are some good examples of descriptive summaries:

wrote initial outline
changed title
small wording changes
turned outline into prose
lots of small edits
total rewrite
a few small tweaks
reworded a paragraph

<docBefore>
${docBefore.content?.type === "text" ? docBefore.content.value : ""}
</docBefore>

<docAfter>
${docAfter.content.value}
</docAfter>
`;
};

const includePatchInChangeGroup = (patch: Automerge.Patch | TextPatch) =>
  patch.path[0] === "content";

export const fileDatatype: DataType<FileDoc, TextAnchor, string> = {
  type: "patchwork:dataType",
  id: "file",
  name: "File",
  icon: "File", // todo: this should be a function, to be type specific
  init,
  getTitle,
  setTitle,
  markCopy,
  promptForAIChangeGroupSummary,
  disableManualCreation: true,
  // todo: long term we probably want something different but this lets
  // us see each change directly
  // groupChanges: noGrouping,

  /*fallbackSummaryForChangeGroup(changeGroup) {
    return <ChangeGroupView changeGroup={changeGroup} />;
  },*/

  includePatchInChangeGroup,

  ...textAnchorsAtPath(["content", "value"]),
};

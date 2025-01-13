import { TextAnchor, textAnchorsAtPath } from "@patchwork/sdk/textAnchors";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import { ChangeGroup, noGrouping } from "@patchwork/sdk/versionControl";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { TextPatch } from "@patchwork/sdk/versionControl";
import * as Automerge from "@automerge/automerge";
import { DocHandle, RawString, updateText } from "@automerge/automerge-repo";
import mime from "mime-types";
import { compareBuffers, isImageFile, useBinaryUrl } from "./utils";
import { isBinaryCheck } from "./isBinaryFile";
import { DeprecateLinkType } from "./migrations/DeprecateLinkType";

// SCHEMA

export type BinaryFileContent = {
  type: "binary";
  value: Uint8Array;
};

export type TextFileContent = {
  type: "text";
  value: string;
};

// A special type for long text files that are stored as RawStrings.
// This avoids performance problems with large text files.
// We can display these in the UI as a blob, but we don't want to edit them.
export type LongTextFileContent = {
  type: "longText";
  value: RawString;
};

// Conservatively use LongTextFileContent for text files longer than 100KB.
const LONG_TEXT_FILE_LENGTH_THRESHOLD = 100000;

export type FileContent =
  | BinaryFileContent
  | TextFileContent
  | LongTextFileContent;

export type FileDoc = HasVersionControlMetadata<TextAnchor, string> & {
  name: string;
  extension: string;
  mimeType: string;
  content: FileContent;
};

// FUNCTIONS
const init = (doc: FileDoc) => {
  initFrom(doc, {
    name: "",
    extension: "",
    mimeType: "",
    content: { type: "text", value: "" },
  });
};

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

const updateFileFromDoc = async (doc: FileDoc): Promise<File> => {
  const isBinary = doc.content.type === "binary";
  const extension = doc.extension ?? (isBinary ? "dat" : "txt");
  const hasExtensionAlready = /\.[a-z0-9]+$/.test(doc.name);
  const fileName = hasExtensionAlready ? doc.name : `${doc.name}.${extension}`;
  const type =
    doc.mimeType ?? mime.lookup(extension) ?? "application/octet-stream";

  const fileContents =
    doc.content.type === "longText"
      ? doc.content.value.toString()
      : doc.content.value;

  return new File([fileContents], fileName, { type });
};

export const updateDocFromFile = async (
  file: File,
  handle: DocHandle<FileDoc>
) => {
  const doc = await handle.doc();
  if (!doc) {
    throw new Error("Document not found");
  }

  const fileContents = new Uint8Array(await file.arrayBuffer());
  const fileSize = fileContents.byteLength;
  const isBinary = isBinaryCheck(fileContents, fileSize);

  // TODO: annoying type
  const historyLength = handle.history()!.length;

  handle.change((doc) => {
    // First, update file metadata.
    if (doc.name !== file.name) {
      doc.name = file.name;
    }
    const extension = file.name.split(".").pop() || "";
    if (doc.extension !== extension) {
      doc.extension = extension;
    }

    if (doc.mimeType !== file.type) {
      doc.mimeType = file.type;
    }

    // Then, update the file content.
    if (isBinary) {
      if (
        doc.content.type !== "binary" ||
        !compareBuffers(fileContents, doc.content.value)
      ) {
        doc.content = { type: "binary", value: fileContents };
      }
    } else {
      const text = new TextDecoder("utf-8").decode(fileContents);
      if (text.length > LONG_TEXT_FILE_LENGTH_THRESHOLD) {
        console.log("using RawString for text of length: ", text.length);
        doc.content = { type: "longText", value: new RawString(text) };
      } else {
        if (doc.content.type !== "text" || doc.content.value !== text) {
          doc.content = { type: "text", value: text };
        }
      }
    }
  });

  // if nothing happened during the above function, the history will be the same size
  const historyGrew = handle.history()!.length > historyLength;
  return { didChange: historyGrew };
};

export const dataType: DataTypeImplementation<FileDoc, TextAnchor, string> = {
  init,
  getTitle,
  setTitle,
  markCopy,
  promptForAIChangeGroupSummary,
  // todo: long term we probably want something different but this lets
  // us see each change directly
  groupChanges: noGrouping,

  /*fallbackSummaryForChangeGroup(changeGroup) {
    return <ChangeGroupView changeGroup={changeGroup} />;
  },*/

  includePatchInChangeGroup,
  ...textAnchorsAtPath(["content", "value"]),

  updateFileFromDoc,
  updateDocFromFile,
  fileExtensions: ["*"],
  migrations: [new DeprecateLinkType()],
};

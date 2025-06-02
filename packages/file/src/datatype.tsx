import { TextAnchor, textAnchorsAtPath } from "@patchwork/sdk/textAnchors";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import { ChangeGroup, noGrouping } from "@patchwork/sdk/versionControl";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { TextPatch } from "@patchwork/sdk/versionControl";
import * as Automerge from "@automerge/automerge/slim";
import { RawString } from "@automerge/automerge-repo";
import mime from "mime-types";
import { isImageFile, useBinaryUrl } from "./utils";
import { DeprecateLinkType } from "./migrations/DeprecateLinkType";
import { BinaryFileDoc, FileDoc, TextFileDoc } from "./types";

export function isBinaryFileDoc(doc: FileDoc): doc is BinaryFileDoc {
  return doc.content instanceof Uint8Array;
}

export function isTextFileDoc(doc: FileDoc): doc is TextFileDoc {
  return typeof doc.content === "string";
}

export const isRawStringFileDoc = (doc: FileDoc): boolean => {
  return Automerge.isRawString(doc.content);
};

// This is really here because RawString requires .toString() to be called
export const getFileContents = (doc: FileDoc): string | Uint8Array => {
  if (isBinaryFileDoc(doc)) {
    return doc.content;
  } else return doc.content.toString();
};

// FUNCTIONS
const init = (doc: FileDoc) => {
  initFrom(doc, {
    name: "",
    extension: "",
    mimeType: "",
    content: "",
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
    isBinaryFileDoc(doc) ? doc.content : undefined
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
  if (isBinaryFileDoc(docAfter)) {
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
${docBefore.content.toString()}
</docBefore>

<docAfter>
${docAfter.content.toString()}
</docAfter>
`;
};

const includePatchInChangeGroup = (patch: Automerge.Patch | TextPatch) =>
  patch.path[0] === "content";

const updateFileFromDoc = async (doc: FileDoc): Promise<File> => {
  const isBinary = isBinaryFileDoc(doc);
  const extension = doc.extension ?? (isBinary ? "dat" : "txt");
  const hasExtensionAlready = /\.[a-z0-9]+$/.test(doc.name);
  const fileName = hasExtensionAlready ? doc.name : `${doc.name}.${extension}`;
  const type =
    doc.mimeType ?? mime.lookup(extension) ?? "application/octet-stream";

  return new File([getFileContents(doc)], fileName, { type });
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
  ...textAnchorsAtPath(["content"]),
  migrations: [new DeprecateLinkType()],
};

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

// Conservatively use LongTextFileContent for text files longer than 100KB.
const LONG_TEXT_FILE_LENGTH_THRESHOLD = 100000;

export type FileDoc = HasVersionControlMetadata<TextAnchor, string> & {
  name: string;
  extension: string;
  mimeType: string;
  contents: Uint8Array | string | RawString;
};

export const fileContents = (doc: FileDoc): string | Uint8Array => {
  if (doc.contents instanceof Uint8Array) {
    return doc.contents;
  } else return doc.contents.toString();
};

// FUNCTIONS
const init = (doc: FileDoc) => {
  initFrom(doc, {
    name: "",
    extension: "",
    mimeType: "",
    contents: "",
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
    doc?.contents instanceof Uint8Array ? doc.contents : undefined
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
  if (docAfter.contents instanceof Uint8Array) {
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
${docBefore.contents.toString()}
</docBefore>

<docAfter>
${docAfter.contents.toString()}
</docAfter>
`;
};

const includePatchInChangeGroup = (patch: Automerge.Patch | TextPatch) =>
  patch.path[0] === "content";

const updateFileFromDoc = async (doc: FileDoc): Promise<File> => {
  const isBinary = doc.contents instanceof Uint8Array;
  const extension = doc.extension ?? (isBinary ? "dat" : "txt");
  const hasExtensionAlready = /\.[a-z0-9]+$/.test(doc.name);
  const fileName = hasExtensionAlready ? doc.name : `${doc.name}.${extension}`;
  const type =
    doc.mimeType ?? mime.lookup(extension) ?? "application/octet-stream";

  const fileContents =
    doc.contents instanceof Uint8Array ? doc.contents : doc.contents.toString();

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
        !(doc.contents instanceof Uint8Array) ||
        !compareBuffers(fileContents, doc.contents)
      ) {
        doc.contents = fileContents;
      }
    } else {
      const text = new TextDecoder("utf-8").decode(fileContents);
      if (text === doc.contents) {
        return;
      }

      if (text.length > LONG_TEXT_FILE_LENGTH_THRESHOLD) {
        console.log("using RawString for text of length: ", text.length);
        doc.contents = new RawString(text);
      } else {
        if (typeof doc.contents === "string") {
          updateText(doc, ["contents"], text);
        } else {
          doc.contents = text;
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

import { FileExportMethod } from "@patchwork/sdk/fileExports";
import { TextAnchor, textAnchorsAtPath } from "@patchwork/sdk/textAnchors";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import { ChangeGroup } from "@patchwork/sdk/versionControl";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { TextPatch } from "@patchwork/sdk/versionControl";
import * as Automerge from "@automerge/automerge";
import { DocHandle, updateText } from "@automerge/automerge-repo";
import crypto from "crypto";
import mime from "mime-types";
import path from "path";
import { isImageFile, useBinaryUrl } from "./utils";

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

const fileExportMethods: FileExportMethod<FileDoc>[] = [
  {
    id: "export-as-file",
    exportMethodName: (doc) => {
      const parts = doc.name.split(".");
      return parts.length > 1 ? "." + parts[parts.length - 1] : "file";
    },
    export: async (doc) => {
      if (doc.content.type === "binary") {
        return new Blob([doc.content.value], {
          type: "application/octet-stream",
        });
      } else if (doc.content.type === "text") {
        return new Blob([doc.content.value], { type: "text/plain" });
      } else {
        if (doc.content.type === "link") {
          const response = await fetch(doc.content.url);
          const blob = await response.blob();
          return blob;
        } else {
          throw new Error("Unsupported content type for export");
        }
      }
    },
    // TODO: in the future we might want to make this content type more specific and accurate
    // based on the actual content of the file. but for now we don't have convenient access
    // to a mimetype, and this isn't used for too much anyway.
    contentType: (doc) => "application/octet-stream",
    fileExtension: (doc) => {
      const parts = doc.name.split(".");
      return parts.length > 1 ? parts[parts.length - 1] : "";
    },
    filename: (doc) => doc.name,
  },
];

const ENDPOINT_URL = "https://file-server-txxa.onrender.com/file";

const uploadFile = async (
  fileBuffer: Uint8Array,
  mimeType: string | false
): Promise<string> => {
  try {
    const response = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": mimeType || "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData.url as string;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const sha256 = (buffer: Uint8Array) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

const docToUnixFile = async (doc: FileDoc) => {
  if (doc.content.type === "link") {
    const response = await fetch(doc.content.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return { content: new Uint8Array(arrayBuffer) };
  } else {
    return { content: doc.content.value };
  }
};

const initDocFromUnixFile = async (
  content: string | Uint8Array,
  fileName: string,
  handle: DocHandle<FileDoc>
): Promise<void> => {
  const fileExtension = path.extname(fileName).slice(1);

  handle.change((doc) => {
    initFrom(doc, {
      name: fileName,
      type: fileExtension,
      // TODO: kinda hacky
      content: { type: "text", value: "" },
    });
  });

  await updateDocFromUnixFile(content, handle);
};

const updateDocFromUnixFile = async (
  content: string | Uint8Array,
  handle: DocHandle<FileDoc>
) => {
  const doc = await handle.doc();
  if (!doc) {
    throw new Error("Document not found");
  }

  const fileExtension = path.extname(doc.name).slice(1);

  // TODO: Buffer is supposed to be a subclass of Uint8Array but
  // maybe (with vitest?) it isn't?
  if (content instanceof Buffer || content instanceof Uint8Array) {
    // BINARY DATA

    // check if's a link and hasn't changed
    if (doc.content.type === "link") {
      const hash = sha256(content);
      if (doc.content.url.endsWith(hash)) {
        console.log("File didn't change, skipping upload");
        return { didChange: false };
      }
    }

    const mimeType = mime.lookup(fileExtension);
    const url = await uploadFile(content, mimeType);
    handle.change((doc) => {
      doc.content = { type: "link", url };
    });
  } else {
    // TEXT DATA

    //  check if it's text and hasn't changed
    if (doc.content.type === "text" && doc.content.value === content) {
      console.log("File didn't change, skipping update");
      return { didChange: false };
    }

    handle.change((doc) => {
      if (doc.content.type === "text") {
        updateText(doc, ["content", "value"], content);
      } else {
        doc.content = { type: "text", value: content };
      }
    });
  }

  return { didChange: true };
};

export const dataType: DataTypeImplementation<FileDoc, TextAnchor, string> = {
  getTitle,
  setTitle,
  markCopy,
  promptForAIChangeGroupSummary,
  // todo: long term we probably want something different but this lets
  // us see each change directly
  // groupChanges: noGrouping,

  /*fallbackSummaryForChangeGroup(changeGroup) {
    return <ChangeGroupView changeGroup={changeGroup} />;
  },*/

  includePatchInChangeGroup,
  fileExportMethods,

  ...textAnchorsAtPath(["content", "value"]),

  docToUnixFile,
  initDocFromUnixFile,
  updateDocFromUnixFile,
};

import { ImportMethod } from "@patchwork/sdk";
import { DocHandle } from "@automerge/automerge-repo";
import { FileDoc } from "./types";
import { isBinaryCheck } from "./isBinaryFile";
import { RawString, updateText } from "@automerge/automerge-repo";

// Conservatively use Automerge RawString for text files longer than 100KB.
// Long strings cause problems for current automerge, should be fixed in the future.
// This means the string can't be edited in the UI.
const LONG_TEXT_FILE_LENGTH_THRESHOLD = 100000;

export const universalImport: ImportMethod = {
  id: "file-universal-import",
  type: "patchwork:importMethod",
  name: "File",
  useAsDefaultMethod: true,
  datatypeId: "file",
  fileExtensions: ["*"], // Accept any file extension
  module: {
    async importData(file: File, handle: DocHandle<unknown>) {
      const doc = await handle.doc();
      if (!doc) {
        throw new Error("Document not found");
      }

      const fileContents = new Uint8Array(await file.arrayBuffer());
      const fileSize = fileContents.byteLength;
      const isBinary = isBinaryCheck(fileContents, fileSize);

      // TODO: annoying type
      const historyLength = handle.history()!.length;

      (handle as DocHandle<FileDoc>).change((doc) => {
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
          doc.content = fileContents;
        } else {
          const text = new TextDecoder("utf-8").decode(fileContents);
          if (text === doc.content) {
            return;
          }

          if (text.length > LONG_TEXT_FILE_LENGTH_THRESHOLD) {
            console.log("using RawString for text of length: ", text.length);
            doc.content = new RawString(text);
          } else {
            if (typeof doc.content === "string") {
              updateText(doc, ["content"], text);
            } else {
              doc.content = text;
            }
          }
        }
      });

      // if nothing happened during the above function, the history will be the same size
      const historyGrew = handle.history()!.length > historyLength;
      return { didChange: historyGrew };
    },
  },
};

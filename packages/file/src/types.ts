import { RawString } from "@automerge/automerge-repo";
import { TextAnchor } from "@patchwork/sdk/textAnchors";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";

// Conservatively use LongTextFileContent for text files longer than 100KB.
const LONG_TEXT_FILE_LENGTH_THRESHOLD = 100000;

export type TextFileDoc = HasVersionControlMetadata<TextAnchor, string> & {
  name: string;
  extension: string;
  mimeType: string;
  content: string | RawString;
};

export type BinaryFileDoc = HasVersionControlMetadata<TextAnchor, string> & {
  name: string;
  extension: string;
  mimeType: string;
  content: Uint8Array;
};

export type FileDoc = BinaryFileDoc | TextFileDoc;

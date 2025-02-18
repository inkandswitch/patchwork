import { RawString } from "@automerge/automerge-repo";
import { TextAnchor } from "../textAnchors";
import { HasVersionControlMetadata } from "../versionControl";

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

// PVH note: we really shouldn't use these
export const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg"];
export const IMAGE_EXTENSIONS = [
  "svg",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
];

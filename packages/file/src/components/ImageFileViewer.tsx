import { useMemo } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge";
import { FileDoc } from "../datatype";
import { EditorProps } from "@/tools";

export type ImageFileDoc = FileDoc & {
  content: Uint8Array;
  type: "svg" | "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp";
};

export const isImageFile = (doc: FileDoc) => {
  return ["svg", "png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(doc.type);
};

export const ImageFileViewer = ({
  docUrl,
  docHeads,
}: EditorProps<ImageFileDoc, never>) => {
  const [_doc] = useDocument<ImageFileDoc>(docUrl);

  const doc = docHeads ? Automerge.view(_doc, docHeads) : _doc;
  const binaryUrl = useBinaryUrl(doc?.content);

  return <img src={binaryUrl} className="w-full h-full object-contain" />;
};

export const useBinaryUrl = (value: Uint8Array) => {
  return useMemo(() => {
    if (!(value instanceof Uint8Array)) {
      return;
    }

    return URL.createObjectURL(new Blob([value]));
  }, [value]);
};

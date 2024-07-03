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

  const binaryUrl = useMemo(() => {
    if (doc && typeof doc.content !== "string") {
      return URL.createObjectURL(new Blob([doc.content]));
    }
    return null;
  }, [doc]);

  return <img src={binaryUrl} className="w-full h-full object-contain" />;
};

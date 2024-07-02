import { useMemo } from "react";
import { FileDoc } from "../datatype";

export const isImageFile = (doc: FileDoc) => {
  return ["svg", "png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(doc.type);
};

type ImageFileViewerProps = {
  doc: FileDoc;
};

export const ImageFileViewer = ({ doc }: ImageFileViewerProps) => {
  const binaryUrl = useMemo(() => {
    if (doc && typeof doc.content !== "string") {
      return URL.createObjectURL(new Blob([doc.content]));
    }
    return null;
  }, [doc]);

  return <img src={binaryUrl} className="w-full h-full object-contain" />;
};

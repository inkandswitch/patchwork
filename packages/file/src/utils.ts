import { useMemo } from "react";
import { FileDoc } from "./datatype";

export const isImageFile = (doc: FileDoc) => {
  return ["svg", "png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(doc.type);
};

export const useBinaryUrl = (value: Uint8Array | undefined) => {
  return useMemo(() => {
    if (!(value instanceof Uint8Array)) {
      return;
    }

    return URL.createObjectURL(new Blob([value]));
  }, [value]);
};

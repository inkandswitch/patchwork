import { useMemo } from "react";
import {
  useDocument,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge";
import { FileDoc } from "../types";
import { EditorProps } from "@patchwork/sdk";

export type ImageFileDoc = FileDoc & {
  type: "svg" | "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp";
};

export const ImageFileViewer = ({
  docUrl,
  docHeads,
}: EditorProps<ImageFileDoc, never>) => {
  const handle = useDocHandle<ImageFileDoc>(docUrl);

  // TODO: this is wrong
  const imgUrl = `/automerge/${handle?.documentId}`;

  return (
    <div className="overflow-auto h-full p-4">
      <img src={imgUrl} className="w-full h-full object-contain" />
    </div>
  );
};

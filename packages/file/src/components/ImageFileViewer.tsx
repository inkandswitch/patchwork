import { useMemo } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge";
import { FileDoc, LinkedFileContent } from "../datatype";
import { EditorProps } from "@/tools";

export type ImageFileDoc = FileDoc & {
  content: LinkedFileContent;
  type: "svg" | "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp";
};

export const ImageFileViewer = ({
  docUrl,
  docHeads,
}: EditorProps<ImageFileDoc, never>) => {
  const [_doc] = useDocument<ImageFileDoc>(docUrl);

  const doc = useMemo(
    () => (_doc && docHeads ? Automerge.view(_doc, docHeads) : _doc),
    [docHeads, _doc]
  );

  return (
    <div className="overflow-auto h-full p-4">
      <img src={doc?.content.url} className="w-full h-full object-contain" />
    </div>
  );
};

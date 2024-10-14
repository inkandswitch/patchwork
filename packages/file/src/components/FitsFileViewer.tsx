import { useMemo } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge";
import { FileDoc, LinkedFileContent } from "../datatype";
import { EditorProps } from "@/tools";

export type FitsFileDoc = FileDoc & {
  content: LinkedFileContent;
  type: "fits";
};

export const isFitsFile = (doc: FileDoc) => {
  return doc.type === "fits";
};

export const FitsFileViewer = ({
  docUrl,
  docHeads,
}: EditorProps<FitsFileDoc, never>) => {
  const [_doc] = useDocument<FitsFileDoc>(docUrl);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;

  if (!doc) {
    return;
  }

  const fileUrl = `https://js9.si.edu/js9/js9.html?url=${doc.content.url}`;

  return (
    <div className="overflow-auto h-full p-4">
      <iframe src={fileUrl} className="w-full h-full" />
    </div>
  );
};

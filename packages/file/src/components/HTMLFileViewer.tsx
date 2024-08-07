import { useMemo } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge";
import { FileDoc, LinkedFileContent } from "../datatype";
import { EditorProps } from "@/tools";
import { useBinaryDataOfDocFile } from "./PDFFileViewer";

export type HTMLFileDoc = FileDoc & {
  content: LinkedFileContent;
  type: "html" | "htm";
};

export const isHTMLFile = (doc: FileDoc) => {
  return ["html", "htm"].includes(doc.type);
};

export const HTMLFileViewer = ({
  docUrl,
  docHeads,
}: EditorProps<HTMLFileDoc, never>) => {
  const [_doc] = useDocument<HTMLFileDoc>(docUrl);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const binaryData = useBinaryDataOfDocFile(doc);
  const textData = useMemo(() => {
    if (!binaryData) {
      return;
    }

    return new TextDecoder().decode(binaryData);
  }, [binaryData]);

  return (
    <div className="overflow-auto h-full">
      {textData ? (
        <iframe
          srcDoc={textData}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      ) : (
        <div>loading</div>
      )}
    </div>
  );
};

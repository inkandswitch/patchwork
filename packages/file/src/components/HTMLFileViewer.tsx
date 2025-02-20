import { useMemo } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge";
import { getFileContents, isBinaryFileDoc } from "../datatype";
import { EditorProps } from "@patchwork/sdk";
import { FileDoc } from "../types";

export type HTMLFileDoc = FileDoc & {
  type: "html" | "htm";
};

export const isHTMLFile = (doc: FileDoc) => {
  return ["html", "htm"].includes(doc.extension);
};

export const HTMLFileViewer = ({
  docUrl,
  docHeads,
}: EditorProps<HTMLFileDoc, never>) => {
  const [_doc] = useDocument<HTMLFileDoc>(docUrl);

  const doc =
    _doc && docHeads ? Automerge.view<HTMLFileDoc>(_doc, docHeads) : _doc;

  const textData = useMemo(() => {
    if (!doc) {
      return;
    }

    if (isBinaryFileDoc(doc)) {
      return new TextDecoder().decode(doc.content);
    } else {
      return doc.content.toString();
    }
  }, [doc]);

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

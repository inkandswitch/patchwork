import { EditorProps } from "@/tools";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { useHandle, useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorView, basicSetup } from "codemirror";
import { useEffect, useState } from "react";
import { TextFileDoc } from "../datatype";
import { python } from "@codemirror/lang-python";
import { json } from "@codemirror/lang-json";
import { yaml } from "@codemirror/lang-yaml";

export const TextFileEditor = ({ docUrl }: EditorProps<TextFileDoc, never>) => {
  const [container, setContainer] = useState<HTMLElement>();
  const [fileDoc] = useDocument<TextFileDoc>(docUrl);
  const handle = useHandle<TextFileDoc>(docUrl);

  useEffect(() => {
    if (!container) {
      return;
    }

    const doc = handle.docSync();
    const view = new EditorView({
      doc: doc.content,
      extensions: [
        basicSetup,
        automergeSyncPlugin({
          handle,
          path: ["content"],
        }),
        getPluginsByType(fileDoc.type),
      ],
      parent: container,
    });

    view.focus();

    return () => {
      view.destroy();
    };
  }, [container, fileDoc.type, handle]);

  return <div className="codemirror-editor" ref={setContainer} />;
};

const getPluginsByType = (type: string) => {
  switch (type) {
    case "py":
      return [python()];
    case "json":
      return [json()];
    case "yaml":
    // todo: for some reason doesn't work
    // return [yaml()];
    default:
      return [];
  }
};

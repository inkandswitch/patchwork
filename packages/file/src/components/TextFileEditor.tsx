import { EditorProps } from "@/tools";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorView } from "codemirror";
import { useEffect, useState } from "react";
import { TextFileDoc } from "../datatype";

export const TextFileEditor = ({ docUrl }: EditorProps<TextFileDoc, never>) => {
  const [container, setContainer] = useState<HTMLElement>();
  const handle = useHandle<TextFileDoc>(docUrl);

  useEffect(() => {
    if (!container) {
      return;
    }

    const doc = handle.docSync();
    const view = new EditorView({
      doc: doc.content,
      extensions: [
        automergeSyncPlugin({
          handle,
          path: ["content"],
        }),
      ],
      parent: container,
    });

    view.focus();

    return () => {
      view.destroy();
    };
  }, [container]);

  return <div className="codemirror-editor" ref={setContainer} />;
};

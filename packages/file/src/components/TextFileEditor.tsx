import {
  TextAnchor,
  annotationsPlugin,
  useAnnotationsInEditor,
  useResolvedAnnotationAtPath,
  useScrollAnnotationsIntoView,
} from "@/lib/textAnchors";
import { EditorProps } from "@/tools";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { EditorView, basicSetup } from "codemirror";
import { useEffect, useState } from "react";
import { TextFileDoc } from "../datatype";
import { useHandleDef } from "@/hooks/useHandleDef";

export const TextFileEditor = ({
  docUrl,
  annotations,
}: EditorProps<TextAnchor, string>) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [editor, setEditor] = useState<EditorView>();
  const [fileDoc] = useDocument<TextFileDoc>(docUrl);
  const handle = useHandleDef<TextFileDoc>(docUrl);

  const resolvedAnnotations = useResolvedAnnotationAtPath({
    doc: fileDoc,
    path: ["content"],
    annotations,
  });

  useScrollAnnotationsIntoView({
    annotations: resolvedAnnotations,
    editor,
  });

  useAnnotationsInEditor({
    annotations: resolvedAnnotations,
    editor,
  });

  useEffect(() => {
    if (!container) {
      return;
    }

    const doc = handle.docSync();
    const view = new EditorView({
      doc: doc!.content,  // TODO: JAH strict fix
      extensions: [
        basicSetup,
        automergeSyncPlugin({
          handle,
          path: ["content"],
        }),
        getPluginsByType(fileDoc!.type),  // TODO: JAH strict fix
        annotationsPlugin,
      ],
      parent: container,
    });

    view.focus();
    setEditor(view);

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
    default:
      return [];
  }
};

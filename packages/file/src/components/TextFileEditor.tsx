import {
  ResolvedTextAnchor,
  TextAnchor,
  annotationsPlugin,
  useAnnotationsInEditor,
  useResolvedAnnotationAtPath,
  useScrollAnnotationsIntoView,
} from "@/lib/textAnchors";
import { EditorProps } from "@/tools";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { EditorView, basicSetup } from "codemirror";
import { useEffect, useRef, useState } from "react";
import { FileDoc, TextFileContent } from "../datatype";
import { useHandleDef } from "@/hooks/useHandleDef";
import { selectedAnchorsPlugin } from "../../../essay/src/codemirrorPlugins/setSelectedAnchors";
import { AnnotationWithUIState } from "@/sdk";

export type TextFileDoc = FileDoc & {
  content: TextFileContent;
};

export const isTextFile = (doc: FileDoc) => {
  return doc.content.type === "text";
};

export const TextFileEditor = ({
  docUrl,
  annotations,
  setSelectedAnchors,
}: EditorProps<TextAnchor, string>) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [editor, setEditor] = useState<EditorView>();
  const [fileDoc] = useDocument<TextFileDoc>(docUrl);
  const handle = useHandleDef<TextFileDoc>(docUrl);

  const resolvedAnnotations = useResolvedAnnotationAtPath({
    doc: fileDoc,
    path: ["content", "value"],
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

  const annotationsRef = useRef<
    AnnotationWithUIState<ResolvedTextAnchor, string>[]
  >([]);
  annotationsRef.current = resolvedAnnotations;

  useEffect(() => {
    if (!container) {
      return;
    }

    const doc = handle.docSync();
    const view = new EditorView({
      doc: doc!.content.value, // TODO: JAH strict fix
      extensions: [
        basicSetup,
        automergeSyncPlugin({
          handle,
          path: ["content", "value"],
        }),
        getPluginsByType(doc!.type), // TODO: JAH strict fix
        annotationsPlugin,
        EditorView.lineWrapping,
        selectedAnchorsPlugin({
          setSelectedAnchors,
          annotationsRef,
          doc,
          path: ["content", "value"],
        }),
      ],
      parent: container,
    });

    view.focus();
    setEditor(view);

    return () => {
      view.destroy();
    };
  }, [container, handle, setSelectedAnchors]);

  return (
    <div
      className="codemirror-editor h-full overflow-auto scroll-smooth"
      ref={setContainer}
    />
  );
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

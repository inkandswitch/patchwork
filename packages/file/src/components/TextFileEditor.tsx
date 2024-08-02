import { useHandleDef } from "@/hooks/useHandleDef";
import {
  ResolvedTextAnchor,
  TextAnchor,
  annotationsPlugin,
  useAnnotationsInEditor,
  useResolvedAnnotationAtPath,
  useScrollAnnotationsIntoView,
} from "@/lib/textAnchors";
import { AnnotationWithUIState } from "@/sdk";
import { EditorProps } from "@/tools";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { keymap } from "@codemirror/view";
import { EditorView, basicSetup } from "codemirror";
import { useEffect, useRef, useState } from "react";
import { selectedAnchorsPlugin } from "../../../essay/src/codemirrorPlugins/setSelectedAnchors";
import { FileDoc, TextFileContent } from "../datatype";

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

    const suppressModEnter = keymap.of([
      {
        key: "Mod-Enter",
        preventDefault: true,
        run: () => true,
      },
    ]);

    const doc = handle.docSync();
    const view = new EditorView({
      doc: doc!.content.value, // TODO: JAH strict fix
      extensions: [
        suppressModEnter, // keep on top to take priority, or be classier someday
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

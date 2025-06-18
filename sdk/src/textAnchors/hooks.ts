import { AnnotationWithUIState } from "../versionControl";
import { getCursorPositionSafely } from "../versionControl";
import * as Automerge from "@automerge/automerge";
import { EditorView } from "@codemirror/view";
import { useEffect, useMemo } from "react";
import { setAnnotationsEffect } from "./annotationsPlugin";
import { ResolvedTextAnchor, TextAnchor } from "./datatype";

// Scroll annotations into view when needed
export const useScrollAnnotationsIntoView = ({
  annotations,
  editor,
}: {
  annotations: AnnotationWithUIState<ResolvedTextAnchor, string>[];
  editor: EditorView | undefined;
}) => {
  const annotationsToScrollIntoView = useMemo(
    () =>
      annotations.filter((annotation) => annotation.shouldBeVisibleInViewport),
    [annotations]
  );

  useEffect(() => {
    // only change scroll position if editor is not focused
    if (
      !editor ||
      editor.hasFocus ||
      annotationsToScrollIntoView.length === 0
    ) {
      return;
    }

    let from = annotationsToScrollIntoView[0].anchor.fromPos;
    let to = annotationsToScrollIntoView[0].anchor.toPos;

    for (let i = 1; i < annotationsToScrollIntoView.length; i++) {
      const annotation = annotationsToScrollIntoView[i];

      if (annotation.anchor.fromPos < from) {
        from = annotation.anchor.fromPos;
      }

      if (annotation.anchor.toPos > to) {
        to = annotation.anchor.toPos;
      }
    }

    editor.dispatch({
      effects: EditorView.scrollIntoView(from, {
        y: "nearest",
        yMargin: 100,
      }),
    });
  }, [annotationsToScrollIntoView, editor]);
};

export const useResolvedAnnotationAtPath = ({
  doc,
  path,
  annotations,
}: {
  doc: Automerge.Doc<unknown> | undefined;
  path: Automerge.Prop[];
  annotations: AnnotationWithUIState<TextAnchor, string>[] | undefined;
}) =>
  useMemo<AnnotationWithUIState<ResolvedTextAnchor, string>[]>(() => {
    if (!annotations || !doc) {
      return [];
    }

    return annotations.flatMap((annotation) => {
      const { fromCursor, toCursor } = annotation.anchor;
      const fromPos = getCursorPositionSafely(doc, path, fromCursor);
      const toPos = getCursorPositionSafely(doc, path, toCursor);

      return fromPos === null || toPos === null
        ? []
        : [
            {
              ...annotation,
              anchor: { fromPos, toPos, fromCursor, toCursor },
            },
          ];
    });
  }, [doc, annotations, path]);

// Propagate annotations into codemirror
export const useAnnotationsInEditor = ({
  editor,
  annotations,
}: {
  editor: EditorView | undefined;
  annotations: AnnotationWithUIState<ResolvedTextAnchor, string>[];
}) =>
  useEffect(() => {
    editor?.dispatch({
      effects: setAnnotationsEffect.of(annotations ?? []),
    });
  }, [annotations, editor]);

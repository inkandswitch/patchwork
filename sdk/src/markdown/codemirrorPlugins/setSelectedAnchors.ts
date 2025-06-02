import { TextAnchor } from "../../textAnchors";
import { AnnotationWithUIState } from "../../versionControl";
import { DocHandle } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";

export function selectedAnchorsPlugin({
  setSelectedAnchors,
  annotationsRef,
  handle,
  path,
}: {
  setSelectedAnchors: (anchors: TextAnchor[]) => void;
  annotationsRef: React.MutableRefObject<AnnotationWithUIState<any, string>[]>;
  handle: DocHandle<unknown>;
  path: A.Prop[];
}) {
  return ViewPlugin.fromClass(
    class {
      update(update: ViewUpdate) {
        if (update.selectionSet) {
          const selection = update.state.selection.ranges[0];

          if (!selection) {
            setSelectedAnchors([]);
            return;
          }

          if (selection.from === selection.to) {
            const cursorPos = selection.from;

            const selectedAnnotationAnchors = annotationsRef.current.flatMap(
              (annotation) =>
                annotation.anchor.fromPos <= cursorPos &&
                annotation.anchor.toPos > cursorPos
                  ? [annotation.anchor]
                  : []
            );

            setSelectedAnchors(
              // remove resolved position
              selectedAnnotationAnchors.map(({ fromCursor, toCursor }) => ({
                fromCursor,
                toCursor,
              }))
            );
          } else {
            const doc = handle.doc();
            if (!doc) {
              return;
            }

            const docLength = update.view.state.doc.length;
            setSelectedAnchors([
              {
                fromCursor: A.getCursor(doc, path, selection.from),
                toCursor: A.getCursor(
                  doc,
                  path,
                  // todo: remove once cursors can point to sides of characters
                  // we can't get a cursor to the end the document because cursors always point to characters
                  // in the future we want to have a cursor API in Automerge that allows to point to a side of a character similar to marks
                  // as a workaround for now we just point to the last character instead if the end of the document is selected
                  selection.to === docLength ? docLength - 1 : selection.to
                ),
              },
            ]);
          }
        }
      }
    }
  );
}

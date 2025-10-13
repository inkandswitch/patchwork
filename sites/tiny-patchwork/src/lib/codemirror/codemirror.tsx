import * as Automerge from "@automerge/automerge";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocHandle } from "@automerge/automerge-repo-react-hooks";
import { Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { lookup } from "../lookup";
import "./codemirror.css";

type CodemirrorProps = {
  docUrl: AutomergeUrl;
  path: Automerge.Prop[];
  onChangeSelection: (from: number, to: number) => void;
  decorations: DecorationSet;
  extensions?: Extension[];
  // Expose the underlying EditorView so consumers can compute coords, etc.
  viewRef?: (view: EditorView | null) => void;
};

export const Codemirror = ({
  docUrl,
  path,
  onChangeSelection,
  decorations,
  extensions,
  viewRef: setViewReady,
}: CodemirrorProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const handle = useDocHandle(docUrl);

  // Effect and field to manage external decorations without remounting editor
  const setDecorations = useRef(StateEffect.define<DecorationSet>()).current;
  const decorationsField = useRef(
    StateField.define<DecorationSet>({
      create() {
        return Decoration.none;
      },
      update(value, tr) {
        for (const e of tr.effects) {
          if (e.is(setDecorations)) return e.value;
        }
        if (tr.docChanged) return value.map(tr.changes);
        return value;
      },
      provide: (f) => EditorView.decorations.from(f),
    })
  ).current;

  const [view, setView] = useState<EditorView | null>(null);

  // Initialize the editor once
  useEffect(() => {
    if (!container || !handle) return;

    const initialDoc = lookup(handle.doc(), path);

    const view = new EditorView({
      doc: initialDoc,
      extensions: [
        automergeSyncPlugin({
          handle: handle as any, // todo: typescript is confused by different version of doc handle
          path,
        }),
        decorationsField,
        EditorView.updateListener.of((update) => {
          // Bubble all updates to consumers (doc changes, viewport, scroll, etc.)
          if (update.selectionSet) {
            const sel = update.state.selection.main;
            onChangeSelection(sel.from, sel.to);
          }
        }),
        ...(extensions ?? []),
      ],
      parent: container,
    });

    setView(view);
    if (setViewReady) setViewReady(view);

    return () => {
      setView(null);
      if (setViewReady) setViewReady(null);
      view.destroy();
    };
  }, [
    container,
    handle,
    path,
    decorationsField,
    setDecorations,
    extensions,
    onChangeSelection,
    setViewReady,
  ]);

  // Update decorations when the DecorationSet prop changes, without remounting
  useEffect(() => {
    if (!view) return;
    view.dispatch({ effects: setDecorations.of(decorations) });
  }, [decorations, setDecorations, view]);

  return <div ref={setContainer} className="w-full h-full" />;
};

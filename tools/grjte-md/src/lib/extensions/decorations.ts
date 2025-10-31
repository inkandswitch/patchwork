import { createEffect } from "solid-js";

/** CodeMirror */
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";

/**
 * Create a CodeMirror extension for managing decorations.
 * @param decorations The initial set of decorations.
 * @returns A tuple containing the extension and a function to create an effect for updating the 
 decorations.
 */
export function createDecorationsExtension(decorations: DecorationSet) {
  console.log("createDecorationsExtension", decorations);
  const setDecorations = StateEffect.define<DecorationSet>();
  const decorationsField = StateField.define<DecorationSet>({
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
  });

  const createDecorationsEffect = (view: EditorView) => createEffect(() => {
    view.dispatch({
      effects: setDecorations.of(decorations),
    });
  });

  return [decorationsField, createDecorationsEffect] as const;
}
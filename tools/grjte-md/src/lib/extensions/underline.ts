import {
  StateField,
  StateEffect,
  type Extension,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
} from "@codemirror/view";

// Define the mark decoration for underlining
const underlineMark = Decoration.mark({ class: "cm-underline" });

// Define the state effect to add an underline
const addUnderline = StateEffect.define<{ from: number; to: number }>({
  map: ({ from, to }, change) => ({
    from: change.mapPos(from),
    to: change.mapPos(to),
  }),
});

// State field to track underlined text ranges
const underlineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(underlines, tr) {
    underlines = underlines.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addUnderline)) {
        underlines = underlines.update({
          add: [underlineMark.range(e.value.from, e.value.to)],
        });
      }
    }
    return underlines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// Command to underline the current selection
const underlineSelection = (view: EditorView): boolean => {
  const effects: StateEffect<unknown>[] = view.state.selection.ranges
    .filter((r) => !r.empty)
    .map(({ from, to }) => addUnderline.of({ from, to }));

  if (!effects.length) return false;

  if (!view.state.field(underlineField, false)) {
    effects.push(StateEffect.appendConfig.of([underlineField, underlineTheme]));
  }

  view.dispatch({ effects });
  return true;
};

// Theme for the underline styling
const underlineTheme = EditorView.baseTheme({
  ".cm-underline": { textDecoration: "underline 3px red" },
});

// Export the complete extension with keybinding
// Using Ctrl-Shift-U to avoid conflicts with system shortcuts
export function underlineExtension(): Extension {
  return [
    underlineField,
    underlineTheme,
    keymap.of([
      {
        key: "Ctrl-Shift-u",
        preventDefault: true,
        run: underlineSelection,
      },
    ]),
  ];
}

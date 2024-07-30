import {
  ViewPlugin,
  DecorationSet,
  EditorView,
  ViewUpdate,
  Decoration,
} from "@codemirror/view";
import { Range } from "@codemirror/state";
import { set } from "lodash";

const CODE_BLOCK_REGEX = /```.*?```/gs;
const INLINE_CODE_REGEX = /`[^\n\`]+?`/g;

function codeBlockDecorations(view: EditorView) {
  const decorations: Range<Decoration>[] = [];

  const text = view.state.doc.sliceString(0);

  const codeBlockMatches = text.matchAll(CODE_BLOCK_REGEX);

  for (const match of codeBlockMatches) {
    const position = match.index;

    decorations.push(
      Decoration.mark({
        class: "font-mono text-sm text-left inline-block",
      }).range(position, position + match[0].length)
    );
  }

  return decorations;
}

function inlineCodeDecorations(view: EditorView) {
  const decorations: Range<Decoration>[] = [];

  const text = view.state.doc.sliceString(0);

  const inlineCodeMatches = text.matchAll(INLINE_CODE_REGEX);

  for (const match of inlineCodeMatches) {
    const position = match.index;

    decorations.push(
      Decoration.mark({
        class: "font-mono text-sm mx-0.5",
      }).range(position, position + match[0].length)
    );
  }

  return decorations;
}

function allCodeDecorations(view: EditorView) {
  return Decoration.set(
    [...codeBlockDecorations(view), ...inlineCodeDecorations(view)],
    true
  );
}

export const codeMonospacePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = allCodeDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = allCodeDecorations(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

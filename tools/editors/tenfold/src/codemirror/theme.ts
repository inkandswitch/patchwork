// slop
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
const noirBaseTheme = EditorView.theme(
  {
    "&": {
      color: "#fff",
      backgroundColor: "#000000",
    },
    ".cm-content": {
      caretColor: "#ff00ff",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#ffffff",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#00ffff66",
    },
    ".cm-tooltip": {
      fontFamily: "monospace",
      whiteSpace: "pre-wrap",
      width: "500px",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      background: "white",
      color: "black",
    },
    ".cm-completionIcon:after": {
      filter: "saturate(0)",
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      {
        background: "#FA505399",
      },
  },
  { dark: true }
);

const noirHighlightStyle = HighlightStyle.define([
  {
    tag: [t.keyword, t.operatorKeyword, t.modifier, t.definitionKeyword],
    color: "#ffffff",
  },
  {
    tag: [t.controlKeyword, t.moduleKeyword, t.logicOperator],
    color: "#ffffff",
    fontWeight: "bold",
  },
  {
    tag: [t.function(t.definition(t.variableName)), t.className, t.tagName],
    color: "#eee",
    fontWeight: "bold",
  },
  {
    tag: [t.variableName, t.attributeName, t.propertyName],
    color: "#fff",
  },
  {
    tag: [t.number, t.bool, t.null, t.atom],
    color: "#ffffff",
  },
  {
    tag: [t.string, t.special(t.string)],
    color: "#eee",
    background: "#222",
    fontStyle: "italic",
  },
  {
    tag: [t.comment, t.lineComment, t.blockComment],
    color: "#bbbbbe",
    fontStyle: "italic",
  },
  {
    tag: [t.punctuation, t.bracket, t.angleBracket, t.separator, t.operator],
    color: "#ddd",
  },
  {
    tag: t.regexp,
    color: "#ff00ff",
    fontWeight: "bold",
  },
]);

export const noirTheme: Extension = [
  noirBaseTheme,
  syntaxHighlighting(noirHighlightStyle),
];

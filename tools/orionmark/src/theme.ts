import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

const MARKDOWN_STYLES: Record<string, object> = {
  "&": {},
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
  "&.cm-editor": {
    height: "100%",
  },
  ".cm-scroller": {
    height: "100%",
  },
  ".cm-content": {
    height: "100%",
    margin: "0",
    textWrap: "pretty",
    lineHeight: "1.5rem",
    caretColor: "var(--color-base-content, #000)",
  },
  ".cm-activeLine": {
    backgroundColor: "inherit",
  },
  ".cm-gutters": {
    borderRight: "0",
  },
  ".cm-line": {
    paddingRight: "40px",
  },
};

const baseHeadingStyles = {
  fontWeight: 600,
  textDecoration: "none",
};

const baseCodeStyles = {
  fontFamily: "monospace",
  fontSize: "14px",
};

const markdownStyles = HighlightStyle.define([
  {
    tag: tags.heading1,
    ...baseHeadingStyles,
    fontSize: "1.5rem",
    lineHeight: "2rem",
  },
  {
    tag: tags.heading2,
    ...baseHeadingStyles,
    fontSize: "1.25rem",
    lineHeight: "1.75rem",
  },
  {
    tag: tags.heading3,
    ...baseHeadingStyles,
    fontSize: "1.1rem",
  },
  {
    tag: tags.strong,
    fontWeight: "bold",
  },
  {
    tag: tags.emphasis,
    fontStyle: "italic",
  },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through",
  },
  { tag: tags.keyword, ...baseCodeStyles, color: "#708" },
  { tag: [tags.literal], ...baseCodeStyles, color: "#164" },
  { tag: [tags.string], ...baseCodeStyles, color: "#5f67b5" },
]);

export const theme = () => [
  EditorView.theme({
    ...MARKDOWN_STYLES,
    ".cm-content": {
      ...MARKDOWN_STYLES[".cm-content"],
      fontFamily: "monospace",
      lineHeight: "1.5rem",
    },
  }),
  syntaxHighlighting(markdownStyles),
];

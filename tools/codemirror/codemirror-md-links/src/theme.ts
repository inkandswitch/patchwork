import { EditorView } from "@codemirror/view";

export const linkTheme = EditorView.baseTheme({
  ".cm-link": {
    textDecoration: "underline",
    cursor: "pointer",
    fontFamily: '"Merriweather Sans", sans-serif',
  },
  "&light .cm-link": {
    color: "#0066cc",
    "&:hover": {
      color: "inherit",
    },
  },
  "&dark .cm-link": {
    color: "#3399ff",
    "&:hover": {
      color: "inherit",
    },
  },
});

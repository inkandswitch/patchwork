import { EditorView } from "@codemirror/view";

export const embedTheme = EditorView.baseTheme({
  ".cm-embed": {
    display: "block",
    border: "1px solid",
    borderRadius: "4px",
    overflow: "hidden",
  },
  "&light .cm-embed": {
    borderColor: "#ddd",
  },
  "&dark .cm-embed": {
    borderColor: "#333",
  },
  ".cm-embed-label": {
    fontFamily: "monospace",
    padding: "4px 8px",
    borderBottom: "1px solid",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "text",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  ".cm-embed-label-text": {
    flex: "1",
    minWidth: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    opacity: 0.7,
    "&:hover": {
      opacity: 1,
    },
  },
  ".cm-embed-open-link": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    cursor: "pointer",
    flexShrink: "0",
    border: "none",
    background: "none",
    padding: "0",
    color: "inherit",
    opacity: 0.7,
    "&:hover": {
      opacity: 1,
    },
  },
  "&light .cm-embed-label": {
    borderBottomColor: "#ddd",
  },
  "&dark .cm-embed-label": {
    borderBottomColor: "#333",
  },
  ".cm-embed patchwork-view": {
    display: "block",
    height: "500px",
    width: "100%",
  },
  ".cm-embed patchwork-view > *": {
    height: "100%",
    width: "100%",
  },
});

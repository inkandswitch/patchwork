import {
  useDocument,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
  indentOnInput,
} from "@codemirror/language";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches } from "@codemirror/search";
import { latex } from "codemirror-lang-latex";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { toolify, ReactToolProps } from "./react-util";
import { LaTeXDoc } from "./datatype";
import "./styles.css";

const cmTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "13px" },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
  },
  ".cm-content": { padding: "12px 0" },
  ".cm-gutters": { border: "none", background: "transparent" },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 12px",
    minWidth: "32px",
  },
  "&.cm-focused": { outline: "none" },
});

const cmDarkTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#1a1a1a", color: "#e5e5e5" },
    ".cm-cursor": { borderLeftColor: "#e5e5e5" },
    ".cm-activeLine": { backgroundColor: "#ffffff08" },
    ".cm-activeLineGutter": { backgroundColor: "#ffffff08" },
    ".cm-selectionBackground": {
      backgroundColor: "#ffffff20 !important",
    },
    ".cm-gutters": { color: "#555" },
  },
  { dark: true }
);

export const LaTeXEditor: React.FC<ReactToolProps> = ({ docUrl }) => {
  const [doc] = useDocument<LaTeXDoc>(docUrl, { suspense: true });
  const handle = useDocHandle<LaTeXDoc>(docUrl, { suspense: true });
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorContainerRef.current || !handle) return;

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const state = EditorState.create({
      doc: handle.doc()?.content ?? "",
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightSpecialChars(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        foldGutter(),
        autocompletion(),
        highlightSelectionMatches(),
        history(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        latex(),
        automergeSyncPlugin({ handle: handle as any, path: ["content"] }),
        cmTheme,
        ...(isDark ? [cmDarkTheme] : []),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    return () => view.destroy();
  }, [handle]);

  if (!doc) return <div className="latex-loading">Loading...</div>;

  return (
    <div className="latex-container">
      <div ref={editorContainerRef} className="latex-cm-container" />
    </div>
  );
};

export const renderLaTeXEditor = toolify(LaTeXEditor);

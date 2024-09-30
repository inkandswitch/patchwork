import { useToolUIState } from "@/explorer/uiState";
import { useHandleDef } from "@/hooks/useHandleDef";
import {
  annotationsPlugin,
  hideLinesWithoutAnnotations,
  ResolvedTextAnchor,
  TextAnchor,
  useAnnotationsInEditor,
  useResolvedAnnotationAtPath,
  useScrollAnnotationsIntoView,
} from "@/lib/textAnchors";
import { AnnotationWithUIState } from "@/sdk";
import { EditorProps } from "@/tools";
import { useRefForCallback } from "@/utils";
import {
  getCursorPositionSafely,
  getCursorSafely,
} from "@/versionControl/utils";
import * as Automerge from "@automerge/automerge";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { Cursor } from "@automerge/automerge/next";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
} from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { searchKeymap } from "@codemirror/search";
import {
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
} from "@codemirror/view";
import clsx from "clsx";
import { EditorView } from "codemirror";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { tool } from "..";
import { selectedAnchorsPlugin } from "../../../essay/src/codemirrorPlugins/setSelectedAnchors";
import { FileDoc, TextFileContent } from "../datatype";
import { CodeMirror } from "../../../../os/src/lib/CodeMirror";

export type TextFileDoc = FileDoc & {
  content: TextFileContent;
};

export const isTextFile = (doc: FileDoc) => {
  return doc && doc.content && doc.content.type === "text";
};

const pathToText = ["content", "value"];

export const TextFileEditor = ({
  docUrl,
  docHeads,
  annotations,
  setSelectedAnchors,
  getFakeDocPathForDocUrl,
  mainDocUrl,
  collapseContentWithoutChanges: collapseContentWithoutAnnotations,
}: EditorProps<TextAnchor, string>) => {
  // TODO: Only reason we need containerRef is for scrollObserverPlugin.
  // Ideally, scrollObserverPlugin would use DOM information from CodeMirror
  // which is available to it directly. But we're actually not scrolling in
  // CodeMirror itself; we're scrolling a container div. We might not want to do
  // this! I think it's better to let CodeMirror handle scrolling, cuz it's
  // better at it. Anyway, for now I'm just using this.
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<EditorView>();
  const [_fileDoc] = useDocument<TextFileDoc>(docUrl);
  const handle = useHandleDef<TextFileDoc>(docUrl);

  const fileDoc =
    docHeads && _fileDoc ? Automerge.view(_fileDoc, docHeads) : _fileDoc;

  const resolvedAnnotations = useResolvedAnnotationAtPath({
    doc: fileDoc,
    path: pathToText,
    annotations,
  });

  useScrollAnnotationsIntoView({
    annotations: resolvedAnnotations,
    editor,
  });

  useAnnotationsInEditor({
    annotations: resolvedAnnotations,
    editor,
  });

  const annotationsRef = useRef<
    AnnotationWithUIState<ResolvedTextAnchor, string>[]
  >([]);
  annotationsRef.current = resolvedAnnotations;

  const fileDocRef = useRefForCallback(fileDoc);

  const docPath = useMemo(
    () => getFakeDocPathForDocUrl(mainDocUrl),
    [getFakeDocPathForDocUrl, mainDocUrl]
  );

  const readOnly = docHeads !== undefined;

  const [toolUIState, changeToolUIState] = useToolUIState<{
    scrollTopCursor?: Cursor;
  }>(docPath, tool.id, () => ({}));

  // TODO: this obviously sucks
  const changeToolUIStateRef = useRefForCallback(changeToolUIState);

  const stableExtensions: Extension = useMemo(() => {
    return [
      suppressModEnter, // keep on top to take priority, or be classier someday

      // some default plugins
      highlightSpecialChars(),
      history(),
      drawSelection(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      dropCursor(),
      indentOnInput(),
      closeBrackets(),
      EditorView.lineWrapping,
      keymap.of([
        ...defaultKeymap,
        ...closeBracketsKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),

      automergeSyncPlugin({
        handle,
        path: pathToText,
      }),
      annotationsPlugin,
      scrollObserverPlugin({ containerRef, fileDocRef, changeToolUIStateRef }),
      [
        ...(collapseContentWithoutAnnotations
          ? [hideLinesWithoutAnnotations]
          : []),
      ],
    ];
  }, [
    changeToolUIStateRef,
    fileDocRef,
    handle,
    collapseContentWithoutAnnotations,
  ]);

  const docDependentExtensions = useMemo(() => {
    if (!fileDoc) {
      return [];
    }

    return [
      getPluginsByType(fileDoc.type),
      ...(readOnly ? [EditorView.editable.of(false)] : []),
      ...(setSelectedAnchors
        ? [
            selectedAnchorsPlugin({
              setSelectedAnchors,
              annotationsRef,
              handle,
              path: pathToText,
            }),
          ]
        : []),
    ];
  }, [fileDoc, readOnly, setSelectedAnchors, handle]);

  const allExtensions = useMemo(() => {
    return [...stableExtensions, ...docDependentExtensions];
  }, [stableExtensions, docDependentExtensions]);

  useEffect(() => {
    // TODO: cursor will likely be off-screen if we have persisted scroll
    // position! we should persist cursor position!
    editor?.focus();
  }, [editor]);

  return (
    fileDoc &&
    toolUIState && (
      <CodeMirror
        ref={containerRef}
        setEditorView={setEditor}
        key={JSON.stringify(docHeads)} // remount component whenever the passed in heads change
        initialDoc={fileDoc.content.value}
        extensions={allExtensions}
        editorViewConfig={{
          scrollTo: scrollTo({ toolUIState, fileDoc }),
        }}
        className={clsx(
          "codemirror-editor h-full overflow-auto scroll-instant",
          {
            "border-2 border-dashed border-gray-400": readOnly,
          }
        )}
      />
    )
  );
};

const getPluginsByType = (type: string) => {
  switch (type) {
    case "py":
      return [python()];
    case "json":
      return [json()];
    default:
      return [];
  }
};

/** Function for reading scroll position from UI state (during init) */
const scrollTo = ({
  toolUIState,
  fileDoc,
}: {
  toolUIState: { scrollTopCursor?: Cursor };
  fileDoc: TextFileDoc;
}) => {
  if (toolUIState.scrollTopCursor) {
    const pos = getCursorPositionSafely(
      fileDoc,
      pathToText,
      toolUIState.scrollTopCursor
    );
    if (!pos) {
      console.warn("TextFileEditor: Failed to get cursor for scroll position");
      return;
    }

    return EditorView.scrollIntoView(pos, { y: "start" });
  }
};

const suppressModEnter = keymap.of([
  {
    key: "Mod-Enter",
    preventDefault: true,
    run: () => true,
  },
]);

/** Plugin for writing scroll position to UI state */
const scrollObserverPlugin = ({
  containerRef,
  fileDocRef,
  changeToolUIStateRef,
}: {
  containerRef: MutableRefObject<HTMLElement | null>;
  fileDocRef: MutableRefObject<TextFileDoc | undefined>;
  changeToolUIStateRef: MutableRefObject<(fn: (state: any) => void) => void>;
}) => {
  let writeScrollTimeout: number | undefined = undefined;

  return EditorView.domEventObservers({
    scroll: (_event, view) => {
      const container = containerRef.current;
      if (!container) {
        console.warn("TextFileEditor scroll: No container");
        return;
      }
      if (writeScrollTimeout) {
        window.clearTimeout(writeScrollTimeout);
      }
      writeScrollTimeout = window.setTimeout(() => {
        if (!fileDocRef.current) {
          console.warn("TextFileEditor scroll: No file doc");
          return;
        }

        let viewportRect = container.getBoundingClientRect();
        let pos = view.posAtCoords({
          x: viewportRect.left,
          y: viewportRect.top,
        });

        if (!pos) {
          console.warn("TextFileEditor scroll: Failed to get position");
          return;
        }

        const cursor = getCursorSafely(fileDocRef.current, pathToText, pos);

        if (!cursor) {
          console.warn("TextFileEditor scroll: Failed to construct cursor");
          return;
        }

        changeToolUIStateRef.current((d) => {
          d.scrollTopCursor = cursor;
        });
      }, 1000);
    },
  });
};

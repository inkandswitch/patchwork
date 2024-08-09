import { useToolUIState } from "@/explorer/uiState";
import { useHandleDef } from "@/hooks/useHandleDef";
import {
  ResolvedTextAnchor,
  TextAnchor,
  annotationsPlugin,
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
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { Cursor } from "@automerge/automerge/next";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { Extension } from "@codemirror/state";
import { keymap, lineNumbers } from "@codemirror/view";
import clsx from "clsx";
import { EditorView, basicSetup } from "codemirror";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { tool } from "..";
import { selectedAnchorsPlugin } from "../../../essay/src/codemirrorPlugins/setSelectedAnchors";
import { FileDoc, TextFileContent } from "../datatype";
import { CodeMirror } from "./CodeMirror";

export type TextFileDoc = FileDoc & {
  content: TextFileContent;
};

export const isTextFile = (doc: FileDoc) => {
  return doc.content.type === "text";
};

const pathToText = ["content", "value"];

export const TextFileEditor = ({
  docUrl,
  annotations,
  setSelectedAnchors,
  getFakeDocPathForDocUrl,
  mainDocUrl,
}: EditorProps<TextAnchor, string>) => {
  // TODO: Only reason we need containerRef is for scrollObserverPlugin.
  // Ideally, scrollObserverPlugin would use DOM information from CodeMirror
  // which is available to it directly. But we're actually not scrolling in
  // CodeMirror itself; we're scrolling a container div. We might not want to do
  // this! I think it's better to let CodeMirror handle scrolling, cuz it's
  // better at it. Anyway, for now I'm just using this.
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<EditorView>();
  const [fileDoc] = useDocument<TextFileDoc>(docUrl);
  const handle = useHandleDef<TextFileDoc>(docUrl);

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

  const [toolUIState, changeToolUIState] = useToolUIState<{
    scrollTopCursor?: Cursor;
  }>(docPath, tool.id, () => ({}));

  // TODO: this obviously sucks
  const changeToolUIStateRef = useRefForCallback(changeToolUIState);

  const stableExtensions: Extension = useMemo(() => {
    return [
      suppressModEnter, // keep on top to take priority, or be classier someday
      basicSetup,
      automergeSyncPlugin({
        handle,
        path: pathToText,
      }),
      annotationsPlugin,
      EditorView.lineWrapping,
      lineNumbers(),
      scrollObserverPlugin({ containerRef, fileDocRef, changeToolUIStateRef }),
    ];
  }, [changeToolUIStateRef, fileDocRef, handle]);

  const docDependentExtensions = useMemo(() => {
    if (!fileDoc) {
      return [];
    }

    return [
      getPluginsByType(fileDoc.type),
      ...(setSelectedAnchors
        ? [
            selectedAnchorsPlugin({
              setSelectedAnchors,
              annotationsRef,
              doc: fileDoc,
              path: pathToText,
            }),
          ]
        : []),
    ];
  }, [fileDoc, setSelectedAnchors]);

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
        initialDoc={fileDoc.content.value}
        extensions={allExtensions}
        editorViewConfig={{
          scrollTo: scrollTo({ toolUIState, fileDoc }),
        }}
        className={clsx("codemirror-editor h-full overflow-auto", {
          // Scroll position initialization should occur without an animation,
          // then we set scroll-smooth for future scrolls
          "scroll-smooth": !!editor,
        })}
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

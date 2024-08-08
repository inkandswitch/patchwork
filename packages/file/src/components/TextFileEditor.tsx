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
import { keymap, lineNumbers } from "@codemirror/view";
import clsx from "clsx";
import { EditorView, basicSetup } from "codemirror";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { tool } from "..";
import { selectedAnchorsPlugin } from "../../../essay/src/codemirrorPlugins/setSelectedAnchors";
import { FileDoc, TextFileContent } from "../datatype";

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
  const [container, setContainer] = useState<HTMLElement | null>(null);
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

  const [didInitializeEditor, setDidInitializeEditor] = useState(false);

  useEffect(() => {
    if (didInitializeEditor || !container || !toolUIState || !fileDoc) {
      return;
    }

    const suppressModEnter = keymap.of([
      {
        key: "Mod-Enter",
        preventDefault: true,
        run: () => true,
      },
    ]);

    const doc = handle.docSync();
    const view = new EditorView({
      doc: doc!.content.value, // TODO: JAH strict fix
      extensions: [
        suppressModEnter, // keep on top to take priority, or be classier someday
        basicSetup,
        automergeSyncPlugin({
          handle,
          path: pathToText,
        }),
        getPluginsByType(doc!.type), // TODO: JAH strict fix
        annotationsPlugin,
        EditorView.lineWrapping,
        lineNumbers(),
        ...(setSelectedAnchors && doc
          ? [
              selectedAnchorsPlugin({
                setSelectedAnchors,
                annotationsRef,
                doc,
                path: pathToText,
              }),
            ]
          : []),
        scrollObserverPlugin({ container, fileDocRef, changeToolUIStateRef }),
      ],
      parent: container,
      scrollTo: scrollTo({ toolUIState, fileDoc }),
    });

    view.focus();
    setEditor(view);

    setDidInitializeEditor(true);

    // TODO: this is a single-use component, so no destroying the editor!
  }, [
    changeToolUIState,
    changeToolUIStateRef,
    container,
    didInitializeEditor,
    fileDoc,
    fileDocRef,
    handle,
    setSelectedAnchors,
    toolUIState,
  ]);

  return (
    <div
      className={clsx("codemirror-editor h-full overflow-auto", {
        // Scroll position initialization should occur without an animation,
        // then we set scroll-smooth for future scrolls
        "scroll-smooth": didInitializeEditor,
      })}
      ref={setContainer}
    />
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

/** Plugin for writing scroll position to UI state */
const scrollObserverPlugin = ({
  container,
  fileDocRef,
  changeToolUIStateRef,
}: {
  container: HTMLElement;
  fileDocRef: React.MutableRefObject<TextFileDoc | undefined>;
  changeToolUIStateRef: MutableRefObject<(fn: (state: any) => void) => void>;
}) => {
  let writeScrollTimeout: number | undefined = undefined;

  return EditorView.domEventObservers({
    scroll: (_event, view) => {
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

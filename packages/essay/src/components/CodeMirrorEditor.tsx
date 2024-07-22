import { useEffect, useRef, useState } from "react";

import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";

import { theme, useMarkdownPlugins } from "@/lib/markdown";
import { annotationsPlugin, useAnnotationsInEditor } from "@/lib/textAnchors";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { type DocHandle } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";
import { frontmatterPlugin } from "../codemirrorPlugins/frontmatter";
import { previewFiguresPlugin } from "../codemirrorPlugins/previewFigures";
import { tableOfContentsPreviewPlugin } from "../codemirrorPlugins/tableOfContentsPreview";

import {
  ResolvedTextAnchor,
  TextAnchor,
  useScrollAnnotationsIntoView,
} from "@/lib/textAnchors";
import { AnnotationWithUIState } from "@/versionControl/schema";
import { isEqual } from "lodash";
import { clickableMarkdownLinksPlugin } from "../codemirrorPlugins/clickableMarkdownLinks";
import { MarkdownDoc } from "../datatype";

export type TextSelection = {
  from: number;
  to: number;
  yCoord: number;
};

export type MarkdownDocEditorProps = {
  editorContainer: HTMLDivElement;
  handle: DocHandle<MarkdownDoc>;
  path: A.Prop[];
  setSelection?: (selection: TextSelection) => void;
  setHasFocus?: (hasFocus: boolean) => void;
  setView?: (view: EditorView) => void;
  setSelectedAnchors?: (anchors: TextAnchor[]) => void;
  readOnly?: boolean;
  docHeads?: A.Heads;
  annotations?: AnnotationWithUIState<ResolvedTextAnchor, string>[];
  setEditorContainerElement?: (container: HTMLDivElement) => void;
};

export function MarkdownDocEditor({
  editorContainer,
  handle,
  path,
  setSelection = () => {},
  setHasFocus = () => {},
  setSelectedAnchors = () => {},
  setView = () => {},
  readOnly,
  docHeads,
  annotations = [],  // TODO: JAH strict fix
  setEditorContainerElement,
}: MarkdownDocEditorProps) {
  const containerRef = useRef(null);
  const editorRoot = useRef<EditorView>(null);
  const [editorCrashed, setEditorCrashed] = useState<boolean>(false);
  const markdownPlugins = useMarkdownPlugins({ docWithAssetsHandle: handle });

  const annotationsRef = useRef<
    AnnotationWithUIState<ResolvedTextAnchor, string>[]
  >([]);
  annotationsRef.current = annotations;

  const handleReady = handle.isReady();

  useScrollAnnotationsIntoView({ annotations, editor: editorRoot.current });
  useAnnotationsInEditor({ annotations, editor: editorRoot.current });

  // This big useEffect sets up the editor view
  useEffect(() => {
    if (!handleReady || !editorContainer) {
      return;
    }
    // TODO: JAH I don't think this is appropriately reactive to the handle loading?
    const doc = handle.docSync()!;
    const docAtHeads = docHeads ? A.view(doc, docHeads) : doc;
    const source = docAtHeads.content; // this should use path

    let previousHasFocus = false;

    const view = new EditorView({
      doc: source,
      extensions: [
        // generic markdown plugins
        ...markdownPlugins,

        // essay editor specific plugins
        EditorView.editable.of(!readOnly),
        theme("serif"),
        markdown({
          codeLanguages: languages,
        }),

        automergeSyncPlugin({
          handle,
          path,
        }),
        frontmatterPlugin,
        annotationsPlugin,
        clickableMarkdownLinksPlugin,
        previewFiguresPlugin,
        tableOfContentsPreviewPlugin,
      ],
      dispatch(transaction, view) {
        const previousSelection = view.state.selection;

        // TODO: can some of these dispatch handlers be factored out into plugins?
        try {
          view.update([transaction]);

          if (view.hasFocus !== previousHasFocus) {
            // hack: delay focus update because otherwise click handlers don't work on elements
            // that are hidden if the editor is not focused, because blur is triggered before click
            setTimeout(() => setHasFocus(view.hasFocus), 200);
            previousHasFocus = view.hasFocus;
          }

          // new selection is sometimes set
          if (
            transaction.newSelection &&
            !isEqual(view.state.selection, previousSelection)
          ) {
            const selection = view.state.selection.ranges[0];

            if (selection) {
              const coords = view.coordsAtPos(selection.from);
              if (coords) {
                // TODO: JAH strict fix... not sure if there should be an else here
                setSelection({
                  from: selection.from,
                  to: selection.to,
                  yCoord:
                    -1 * view.scrollDOM.getBoundingClientRect().top +
                    coords.top,
                });
              }

              if (selection.from === selection.to) {
                const cursorPos = selection.from;

                const selectedAnnotationAnchors =
                  annotationsRef.current.flatMap((annotation) =>
                    annotation.anchor.fromPos <= cursorPos &&
                    annotation.anchor.toPos > cursorPos
                      ? [annotation.anchor]
                      : []
                  );

                setSelectedAnchors(
                  // remove resolved position
                  selectedAnnotationAnchors.map(({ fromCursor, toCursor }) => ({
                    fromCursor,
                    toCursor,
                  }))
                );
              } else {
                const docLength = view.state.doc.length;
                setSelectedAnchors([
                  {
                    fromCursor: A.getCursor(doc, path, selection.from),
                    toCursor: A.getCursor(
                      doc,
                      path,
                      // todo: remove once cursors can point to sides of characters
                      // we can't get a cursor to the end the document because cursors always point to characters
                      // in the future we want to have a cursor API in Automerge that allows to point to a side of a character similar to marks
                      // as a workaround for now we just point to the last character instead if the end of the document is selected
                      selection.to === docLength ? docLength - 1 : selection.to
                    ),
                  },
                ]);
              }
            } else {
              setSelectedAnchors([]);
            }
          }
        } catch (e) {
          // If we hit an error in dispatch, it can lead to bad situations where
          // the editor has crashed and isn't saving data but the user keeps typing.
          // To avoid this, we hard crash so the user knows things are broken and reloads
          // before they lose data.

          console.error(
            "Encountered an error in dispatch function; crashing the editor to notify the user and avoid data loss."
          );
          console.error(e);
          setEditorCrashed(true);
          editorRoot.current?.destroy();
        }
      },
      parent: containerRef.current,
    });

    editorRoot.current = view;

    if (setEditorContainerElement) {
      setEditorContainerElement(containerRef.current);
    }

    // pass the view up to the parent so it can use it too
    setView(view);

    view.focus();

    return () => {
      view.destroy();
    };
  }, [handle, handleReady, docHeads, editorContainer, markdownPlugins]);

  if (editorCrashed) {
    return (
      <div className="bg-red-100 p-4 rounded-md">
        <p className="mb-2">⛔️ Error: editor crashed!</p>
        {import.meta.env.MODE === "development" && (
          <p className="mb-2">Probably due to hot reload in dev.</p>
        )}
        <p className="mb-2">
          We're sorry for the inconvenience. Please reload to keep working. Your
          data was most likely saved before the crash.
        </p>
        <p className="mb-2">
          If you'd like you can screenshot the dev console as a bug report.
        </p>
      </div>
    );
  }

  const onKeyDown = (evt) => {
    // Let cmd-s thru for saving the doc
    if (evt.key === "s" && (evt.metaKey || evt.ctrlKey)) {
      return;
    }
    // Let cmd-\ thru for toggling the sidebar
    if (evt.key === "\\" && (evt.metaKey || evt.ctrlKey)) {
      return;
    }
    // Let cmd-g thru for grouping annotations
    if (evt.key === "g" && (evt.metaKey || evt.ctrlKey)) {
      return;
    }
    // Let cmd-g thru for grouping annotations
    if (evt.key === "`" && (evt.metaKey || evt.ctrlKey)) {
      return;
    }
    evt.stopPropagation();
  };

  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <div
        className="codemirror-editor flex-grow relative min-h-screen"
        ref={containerRef}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

import { useMemo, useRef, useState } from "react";

import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";

import { theme, useMarkdownPlugins } from "@patchwork/sdk/markdown";
import {
  annotationsPlugin,
  hideLinesWithoutAnnotations,
  useAnnotationsInEditor,
} from "@patchwork/sdk/textAnchors";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { type DocHandle } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge";
import clsx from "clsx";
import { frontmatterPlugin } from "../codemirrorPlugins/frontmatter";
import { previewFiguresPlugin } from "../codemirrorPlugins/previewFigures";
import { tableOfContentsPreviewPlugin } from "../codemirrorPlugins/tableOfContentsPreview";

import { CodeMirror } from "@patchwork/sdk/components";
import {
  ResolvedTextAnchor,
  TextAnchor,
  useScrollAnnotationsIntoView,
} from "@patchwork/sdk/textAnchors";
import { useDedupe } from "@patchwork/sdk/versionControl";
import { AnnotationWithUIState } from "@patchwork/sdk/versionControl";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { get, isEqual } from "lodash";
import { clickableMarkdownLinksPlugin } from "../codemirrorPlugins/clickableMarkdownLinks";
import { selectedAnchorsPlugin } from "@patchwork/sdk/markdown";
import { MarkdownDoc } from "../datatype";

export type TextSelection = {
  from: number;
  to: number;
  yCoord: number;
};

export type MarkdownDocEditorProps = {
  handle: DocHandle<MarkdownDoc>;
  path: A.Prop[];
  setSelection?: (selection: TextSelection) => void;
  setHasFocus?: (hasFocus: boolean) => void;
  setView?: (view: EditorView) => void;
  setSelectedAnchors?: (anchors: TextAnchor[]) => void;
  readOnly?: boolean;
  docHeads?: A.Heads;
  annotations?: AnnotationWithUIState<ResolvedTextAnchor, string>[];
  collapseContentWithoutAnnotations?: boolean;
};

export function MarkdownDocEditor({
  handle,
  path,
  setSelection = () => {},
  setHasFocus = () => {},
  setView = () => {},
  setSelectedAnchors = () => {},
  readOnly,
  docHeads,
  annotations = [], // TODO: JAH strict fix
  collapseContentWithoutAnnotations,
}: MarkdownDocEditorProps) {
  const editorRoot = useRef<EditorView | undefined>(undefined);
  const markdownPlugins = useMarkdownPlugins({ docHandle: handle });

  const [doc] = useDocument(handle.url);
  const docAtHeads = doc && docHeads ? A.view(doc, docHeads) : doc;
  const content = get(docAtHeads, path);

  const annotationsRef = useRef<
    AnnotationWithUIState<ResolvedTextAnchor, string>[]
  >([]);
  annotationsRef.current = annotations;

  useScrollAnnotationsIntoView({ annotations, editor: editorRoot.current });
  useAnnotationsInEditor({ annotations, editor: editorRoot.current });

  const pathDeduped = useDedupe(path, (a, b) => isEqual(a, b));

  const extensions = useMemo(() => {
    let previousHasFocus = false;

    return [
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
        path: pathDeduped,
      }),
      frontmatterPlugin,
      annotationsPlugin,
      clickableMarkdownLinksPlugin,
      previewFiguresPlugin,
      tableOfContentsPreviewPlugin,
      selectedAnchorsPlugin({
        setSelectedAnchors,
        annotationsRef,
        handle,
        path: pathDeduped,
      }),
      collapseContentWithoutAnnotations ? hideLinesWithoutAnnotations : [],
      EditorView.updateListener.of((update) => {
        const view = update.view;
        const previousSelection = update.startState.selection;

        if (view.hasFocus !== previousHasFocus) {
          setTimeout(() => setHasFocus(view.hasFocus), 200);
          previousHasFocus = view.hasFocus;
        }

        if (
          update.selectionSet &&
          !isEqual(view.state.selection, previousSelection)
        ) {
          const selection = view.state.selection.ranges[0];

          if (selection) {
            let coords;
            try {
              coords = view.coordsAtPos(
                Math.min(view.state.doc.length - 1, selection.from)
              );
            } catch (e) {
              // don't propagate the selection if we get an out of bounds error
              return;
            }

            if (coords) {
              setSelection({
                from: selection.from,
                to: selection.to,
                yCoord:
                  -1 * view.scrollDOM.getBoundingClientRect().top + coords.top,
              });
            }
          }
        }
      }),
    ];
  }, [
    collapseContentWithoutAnnotations,
    handle,
    markdownPlugins,
    pathDeduped,
    readOnly,
    setHasFocus,
    setSelectedAnchors,
    setSelection,
  ]);

  return (
    <div className="flex flex-col items-stretch min-h-screen h-full">
      <CodeMirror
        setEditorView={(view) => {
          editorRoot.current = view;
          setView(view);
        }}
        key={JSON.stringify(docHeads)} // remount component whenever the passed in heads change
        initialDoc={content}
        extensions={extensions}
        className={clsx("codemirror-editor h-full scroll-instant")}
      />
    </div>
  );
}

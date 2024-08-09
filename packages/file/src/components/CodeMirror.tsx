import { Extension, StateEffect } from "@codemirror/state";
import { EditorViewConfig } from "@codemirror/view";
import { EditorView } from "codemirror";
import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { mergeRefs } from "react-merge-refs";

/** A minimal React component for rendering a CodeMirror editor. Currently only
 * used for TextFileEditor, but if people think it's nice, it could be worked
 * into more uses of CodeMirror. */
export const CodeMirror = memo(
  forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      /** `setEditorView` is called with the EditorView object when it is
       * initialized. This will only be called once per mount. */
      setEditorView?: (editorView: EditorView) => void;

      initialDoc: string;

      /** `extensions` is monitored reactively; you can add and remove
       * extensions while the CodeMirror is mounted. (But make sure they're
       * memoized, so they're not added and removed unnecessarily!) */
      extensions: Extension;

      /** `editorViewConfig` is not monitored reactively; it is only used at
       * initialization. */
      editorViewConfig?: Omit<
        EditorViewConfig,
        "parent" | "doc" | "extensions"
      >;
    }
  >(function CodeMirror(props, ref) {
    const {
      setEditorView,
      initialDoc,
      extensions,
      editorViewConfig,
      ...divProps
    } = props;

    const [div, setDiv] = useState<HTMLDivElement | null>();
    const viewRef = useRef<EditorView>();

    // Initialize the editor
    useEffect(() => {
      if (div && initialDoc && !viewRef.current) {
        // This body will only run once in the component's lifetime
        viewRef.current = new EditorView({
          parent: div,
          doc: initialDoc,
          extensions,
          ...editorViewConfig,
        });
        setEditorView?.(viewRef.current);
      }
    });

    // Reconfigure the editor when extensions change
    useEffect(() => {
      if (viewRef.current) {
        viewRef.current.dispatch({
          effects: StateEffect.reconfigure.of(extensions),
        });
      }
    }, [extensions]);

    return <div ref={mergeRefs([ref, setDiv])} {...divProps} />;
  })
);

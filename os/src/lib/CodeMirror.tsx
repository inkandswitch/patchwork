import { Extension, StateEffect } from "@codemirror/state";
import { EditorViewConfig } from "@codemirror/view";
import { EditorView } from "codemirror";
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";
import { mergeRefs } from "react-merge-refs";

/** A minimal React component for rendering a CodeMirror editor */
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
    const [editorCrashed, setEditorCrashed] = useState<boolean>(false);

    const allExtensions = useMemo(
      () => [
        extensions,
        EditorView.exceptionSink.of((exception) => {
          console.error(
            "Encountered an error in the editor; crashing to notify the user and avoid data loss."
          );
          console.error(exception);
          setEditorCrashed(true);

          if (viewRef.current) {
            viewRef.current.destroy();
          }
        }),
      ],
      [extensions]
    );

    // Initialize the editor
    useEffect(() => {
      if (div && initialDoc && !viewRef.current) {
        // This body will only run once in the component's lifetime
        const view = (viewRef.current = new EditorView({
          parent: div,
          doc: initialDoc,
          extensions: allExtensions,
          ...editorViewConfig,
        }));
        setEditorView?.(viewRef.current);

        console.log("register error handler");
      }
    });

    // Reconfigure the editor when extensions change
    useEffect(() => {
      if (viewRef.current) {
        viewRef.current.dispatch({
          effects: StateEffect.reconfigure.of(allExtensions),
        });
      }
    }, [allExtensions]);

    if (editorCrashed) {
      return (
        <div className="bg-red-100 p-4">
          <p className="mb-2">⛔️ Error: editor crashed!</p>
          {import.meta.env.MODE === "development" && (
            <p className="mb-2">Probably due to hot reload in dev.</p>
          )}
          <p className="mb-2">
            We're sorry for the inconvenience. Please reload to keep working.
            Your data was most likely saved before the crash.
          </p>
          <p className="mb-2">
            If you'd like you can screenshot the dev console as a bug report.
          </p>
        </div>
      );
    }

    return <div ref={mergeRefs([ref, setDiv])} {...divProps} />;
  })
);

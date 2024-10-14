import { HasAssets } from "@/assets";
import { DocHandle } from "@automerge/automerge-repo";
import { EditorView } from "@codemirror/view";
import { useEffect, useState } from "react";
import { useMarkdownPlugins } from "./useMarkdownPlugins";
import { theme } from "./codemirrorPlugins/theme";

type MarkdownInputProps = {
  value: string;

  // when no onChange handler is defined the markdown input will be readonly
  onChange?: (value: string) => void;

  // handle to the main doc which has an assets doc that we use
  // to store dragged in images
  docWithAssetsHandle?: DocHandle<HasAssets>;

  // set focus after initialization
  autoFocus?: boolean;
};

export const MarkdownInput = ({
  value,
  onChange,
  docWithAssetsHandle,
  autoFocus,
}: MarkdownInputProps) => {
  const [editorView, setEditorView] = useState<EditorView | undefined>(
    undefined
  );
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [remountEditor, setRemountEditor] = useState<object>({});
  const plugins = useMarkdownPlugins({ docWithAssetsHandle });

  // trigger a remount when value has changed from the outside
  useEffect(() => {
    if (editorView && editorView.state.doc.toString() !== value) {
      setRemountEditor({});
    }
  }, [value, editorView]);

  useEffect(() => {
    if (!container) {
      return;
    }

    const view = new EditorView({
      doc: value,
      extensions: [
        ...plugins,
        theme("sans"),
        EditorView.editable.of(onChange !== undefined),
        onChange
          ? EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                onChange(update.state.doc.toString());
              }
            })
          : [],
      ],

      parent: container,
    });

    if (autoFocus) {
      view.focus();
    }

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [container, remountEditor, onChange, plugins]);

  return <div className="codemirror-editor" ref={setContainer} />;
};

import { Prop } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { EditorView } from "@codemirror/view";
import { useEffect, useState } from "react";
import { useMarkdownPlugins } from "./useMarkdownPlugins";
import { theme } from "./codemirrorPlugins/theme";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import { get } from "lodash";

type MarkdownEditorProps = {
  handle: DocHandle<unknown>;
  path: Prop[];
};

export const MarkdownEditor = ({ handle, path }: MarkdownEditorProps) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const plugins = useMarkdownPlugins({ docHandle: handle });

  useEffect(() => {
    if (!container) {
      return;
    }

    const doc = handle.doc();
    const view = new EditorView({
      doc: get(doc, path) ?? "",
      extensions: [
        ...plugins,
        theme("sans"),
        automergeSyncPlugin({
          handle,
          path,
        }),
      ],

      parent: container,
    });

    view.focus();

    return () => {
      view.destroy();
    };
  }, [container, plugins]);

  return <div className="codemirror-editor" ref={setContainer} />;
};

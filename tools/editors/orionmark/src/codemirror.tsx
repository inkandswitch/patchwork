import * as Automerge from "@automerge/automerge";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocHandle } from "@automerge/automerge-repo-react-hooks";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useState } from "react";

type CodemirrorProps = {
  docUrl: AutomergeUrl;
  path: Automerge.Prop[];
  extensions?: Extension[];
};

const lookup = <T = any,>(doc: any, path: Automerge.Prop[]): T | undefined => {
  let current = doc;
  for (const key of path) {
    current = current[key];
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
};

export const Codemirror = ({ docUrl, path, extensions }: CodemirrorProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const handle = useDocHandle(docUrl);

  useEffect(() => {
    if (!container || !handle) return;

    const initialDoc = lookup(handle.doc(), path);

    const view = new EditorView({
      doc: initialDoc,
      extensions: [
        automergeSyncPlugin({
          handle: handle as any,
          path,
        }),
        ...(extensions ?? []),
      ],
      parent: container,
    });

    return () => {
      view.destroy();
    };
  }, [container, handle, path, extensions]);

  return <div ref={setContainer} style={{ width: "100%", height: "100%" }} />;
};

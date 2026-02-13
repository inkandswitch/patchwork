import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocHandle } from "@automerge/react";
import {
  Tldraw,
  useEditor,
  type VecLike,
  type TLContent,
} from "@tldraw/tldraw";
import { useAutomergeStore } from "./lith/useAutomergeStore.ts";
import type { TLDrawDoc } from "./datatype.ts";
import { useCallback, useEffect, useMemo } from "react";

export function TldrawTool({ docUrl }: { docUrl: AutomergeUrl }) {
  const handle = useDocHandle<TLDrawDoc>(docUrl, { suspense: true });
  const userId = "chee";
  const store = useAutomergeStore({ handle, userId });

  return (
    <Tldraw inferDarkMode autoFocus store={store}>
      <TldrawInner docUrl={docUrl} />
    </Tldraw>
  );
}

function TldrawInner(props: { docUrl: AutomergeUrl }) {
  const key = useMemo(() => `${props.docUrl}-camera`, [props.docUrl]);

  const editor = useEditor();
  const onChange = useCallback(() => {
    if (!editor) return;
    const camstate = editor.getCameraState();
    if (camstate == "moving") {
      // todo debounce?
      localStorage.setItem(key, JSON.stringify(editor.getCamera()));
    }
  }, []);

  useEffect(() => {
    if (!editor) return;

    // Override the tldraw paste handler to avoid "could not migrate content"
    // errors when pasting from newer tldraw versions (e.g. tldraw.com may
    // run a canary build whose schema sequence versions are ahead of ours).
    editor.registerExternalContentHandler(
      "tldraw",
      ({ point, content }: { point?: VecLike; content: TLContent }) => {
        editor.run(() => {
          const selectionBoundsBefore = editor.getSelectionPageBounds();
          editor.markHistoryStoppingPoint("paste");

          for (const shape of content.shapes) {
            if (content.rootShapeIds.includes(shape.id)) {
              shape.isLocked = false;
            }
          }

          // Replace the pasted content's schema with ours so that
          // migrateStoreSnapshot sees matching versions and skips migration
          // rather than failing on unknown future sequence versions.
          content.schema = editor.store.schema.serialize();

          editor.putContentOntoCurrentPage(content, {
            point,
            select: true,
          });

          const selectedBoundsAfter = editor.getSelectionPageBounds();
          if (
            selectionBoundsBefore &&
            selectedBoundsAfter &&
            selectionBoundsBefore.collides(selectedBoundsAfter)
          ) {
            editor.updateInstanceState({ isChangingStyle: true });
          }
        });
      }
    );

    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const cam = JSON.parse(existing);
        editor.setCamera(cam);
      } catch {
        localStorage.removeItem(key);
      }
    }
    editor.on("change", onChange);
    return () => void editor.off("change", onChange);
  }, [editor]);
  return null;
}

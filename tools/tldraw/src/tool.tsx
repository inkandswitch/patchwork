import type {
  AutomergeUrl,
  DocumentId,
  UrlHeads,
} from "@automerge/automerge-repo";
import { stringifyAutomergeUrl, useDocHandle } from "@automerge/react";
import {
  BaseBoxShapeUtil,
  DEFAULT_EMBED_DEFINITIONS,
  Tldraw,
  useEditor,
  type EmbedDefinition,
  type HistoryEntry,
  type TLRecord,
  type TLBaseShape,
  T,
  type RecordProps,
  HTMLContainer,
  defaultHandleExternalUrlContent,
  useToasts,
} from "tldraw";
import { useAutomergeStore } from "./lith/useAutomergeStore.ts";
import type { TLDrawDoc } from "./datatype.ts";
import { useCallback, useEffect, useMemo } from "react";

declare module "react" {
  export namespace JSX {
    export interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "doc-url": string;
        "tool-id"?: string | null;
        class?: string;
      };
    }
  }
}

interface ITldrawPatchworkView
  extends TLBaseShape<
    "patchworkview",
    { w: number; h: number; tool?: string; doc?: string }
  > {}

class TldrawPatchworkView extends BaseBoxShapeUtil<ITldrawPatchworkView> {
  static override type = "patchworkview" as const;

  static override props: RecordProps<ITldrawPatchworkView> = {
    w: T.number,
    h: T.number,
    tool: T.optional(T.string),
    doc: T.optional(T.string),
  };

  getDefaultProps(): ITldrawPatchworkView["props"] {
    return {
      w: 230,
      h: 230,
    };
  }

  component(shape: ITldrawPatchworkView) {
    return (
      <HTMLContainer
        style={{
          height: shape.props.h,
          width: shape.props.w,
          pointerEvents: "all",
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      >
        <patchwork-view
          doc-url={shape.props.doc!}
          tool-id={shape.props.tool ? shape.props.tool : undefined}
        />
      </HTMLContainer>
    );
  }

  indicator(shape: ITldrawPatchworkView) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

export function TldrawTool({ docUrl }: { docUrl: AutomergeUrl }) {
  const handle = useDocHandle<TLDrawDoc>(docUrl, { suspense: true });
  const userId = "chee";
  const store = useAutomergeStore({
    handle,
    userId,
    shapeUtils: [TldrawPatchworkView],
  });

  return (
    <Tldraw
      inferDarkMode
      autoFocus
      store={store}
      shapeUtils={[TldrawPatchworkView]}
    >
      <TldrawInner docUrl={docUrl} />
    </Tldraw>
  );
}

function TldrawInner(props: { docUrl: AutomergeUrl }) {
  const key = useMemo(() => `${props.docUrl}-camera`, [props.docUrl]);
  const toasts = useToasts();

  const editor = useEditor();
  const onChange = useCallback(() => {
    if (!editor) return;
    const camstate = editor.getCameraState();
    if (camstate == "moving") {
      localStorage.setItem(key, JSON.stringify(editor.getCamera()));
    }
  }, []);

  useEffect(() => {
    if (!editor) return;
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
    editor.registerExternalContentHandler("url", async (info) => {
      const url = new URL(info.url);

      const params = new URLSearchParams(url.hash.slice(1));
      const documentId = params.get("doc") as DocumentId | null;
      const tool = params.get("tool");
      const heads = params.get("heads") as string | null;
      if (!documentId) {
        await defaultHandleExternalUrlContent(editor, info, {
          toasts: toasts,
          msg() {
            return "";
          },
        });
        return;
      }
      const automergeUrl = stringifyAutomergeUrl({
        documentId,
        heads: heads?.split("|") as UrlHeads,
      });
      const center = info.point ?? editor.getViewportPageBounds().center;
      const x = center.x - 200;
      const y = center.y - 100;

      editor.createShape({
        type: "patchworkview",
        x,
        y,
        props: { tool: tool ?? "", doc: automergeUrl },
      });
    });
    return () => void editor.off("change", onChange);
  }, [editor]);
  return null;
}

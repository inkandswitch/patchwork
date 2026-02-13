import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocHandle } from "@automerge/react";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import {
  Tldraw,
  useEditor,
  getMediaAssetInfoPartial,
  type VecLike,
  type TLContent,
  type TLAssetId,
  type TLAsset,
} from "@tldraw/tldraw";
import { useAutomergeStore } from "./lith/useAutomergeStore.ts";
import type { TLDrawDoc } from "./datatype.ts";
import { useCallback, useEffect, useMemo } from "react";
import type { UnixFileEntry } from "@inkandswitch/patchwork-filesystem";
import { automergeUrlToServiceWorkerUrl } from "@inkandswitch/patchwork-filesystem";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function extensionForMimeType(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || mimeType.split("/")[1] || "bin";
}

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
  const repo = useRepo();

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

    // Handle pasted/dropped files (images, videos) by storing them as
    // UnixFileEntry automerge docs and referencing them via service-worker URLs.
    editor.registerExternalAssetHandler("file", async ({ file, assetId }) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      // Create a stable asset ID if one wasn't provided
      const id = assetId ?? (`asset:${crypto.randomUUID()}` as TLAssetId);

      // Read the file bytes
      const bytes = new Uint8Array(await file.arrayBuffer());

      // Determine extension and name
      const ext = extensionForMimeType(file.type);
      const name =
        file.name && file.name !== "image.png"
          ? file.name
          : `Pasted image on ${new Date().toLocaleDateString()}.${ext}`;

      // Create an automerge doc for the file
      const fileHandle = repo.create<UnixFileEntry>();
      fileHandle.change((doc) => {
        doc.content = bytes;
        doc.extension = ext;
        doc.mimeType = file.type;
        doc.name = name;
      });

      // Build the asset using tldraw's helper to get dimensions etc.
      const asset = await getMediaAssetInfoPartial(file, id, isImage, isVideo);

      // Point the asset's src at the service-worker URL for this doc
      asset.props.src = automergeUrlToServiceWorkerUrl(fileHandle.url);

      return asset as TLAsset;
    });

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

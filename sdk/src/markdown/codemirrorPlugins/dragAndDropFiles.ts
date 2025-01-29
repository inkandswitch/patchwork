import { EditorView, ViewPlugin } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "@patchwork/file";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type DragAndDropPluginConfig = {
  createImageReference: (file: File) => Promise<string | undefined>;
  createVideoReference: (file: File) => Promise<string | undefined>;
};

export const dragAndDropFilesPlugin = ({
  createImageReference,
  createVideoReference,
}: DragAndDropPluginConfig) => {
  let view: EditorView;
  let previousSelection: EditorSelection;

  const onDragEnter = (event: DragEvent) => {
    previousSelection = view.state.selection;
    event.preventDefault();
    event.dataTransfer!.dropEffect = "copy";
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const getFileExtension = (file: File): string | undefined => {
    return file.name.split(".").pop()?.toLowerCase();
  };

  const isVideoFile = (file: File): boolean => {
    const extension = getFileExtension(file);
    return extension ? VIDEO_EXTENSIONS.includes(extension) : false;
  };

  const isImageFile = (file: File): boolean => {
    const extension = getFileExtension(file);
    return extension ? IMAGE_EXTENSIONS.includes(extension) : false;
  };

  const validateFileSize = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Only files smaller than 10MB are supported");
    }
  };

  const handleFileDrop = async (file: File, pos: number) => {
    try {
      validateFileSize(file);

      let text: string | undefined;
      if (isVideoFile(file)) {
        text = await createVideoReference(file);
      } else if (isImageFile(file)) {
        text = await createImageReference(file);
      } else {
        throw new Error(`Not an image or video: ${file.name}`);
      }

      if (text) {
        view.dispatch({
          changes: { from: pos, insert: text },
        });
      }
    } catch (error) {
      console.error("Failed to create file reference", error);
    }
  };

  const onDrop = (event: DragEvent) => {
    const files = event.dataTransfer!.files;
    if (files.length > 0) {
      const file = files[0];
      const pos = view.posAtCoords({
        x: event.clientX,
        y: event.clientY,
      });

      if (!pos) {
        return;
      }

      handleFileDrop(file, pos);
    }
    return true;
  };

  return ViewPlugin.fromClass(
    class {
      constructor(v: EditorView) {
        view = v;
        view.dom.addEventListener("dragenter", onDragEnter);
        view.dom.addEventListener("dragover", onDragOver);
        view.dom.addEventListener("drop", onDrop);
      }

      destroy() {
        view.dom.removeEventListener("dragenter", onDragEnter);
        view.dom.removeEventListener("dragover", onDragOver);
        view.dom.removeEventListener("drop", onDrop);
      }
    }
  );
};

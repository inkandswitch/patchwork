import { CodeMirror } from "./lib/codemirror.tsx";

/** CodeMirror Extensions */
import { RangeSet, type Extension } from "@codemirror/state";
import { Decoration, WidgetType } from "@codemirror/view";
import { commentButtonGutter } from "./lib/comments/commentButtonGutter.ts";

/** Automerge */
import type { PatchworkToolProps } from "./types.ts";
import { parseAutomergeUrl, cursor } from "@automerge/automerge-repo";
import type { DocHandle, Ref } from "@automerge/automerge-repo";

/** Patchwork */
import { getRegistry } from "@inkandswitch/patchwork-plugins";
import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import { Diff } from "@inkandswitch/annotations-diff";
import { IsSelected } from "@inkandswitch/annotations-selection";
import {
  CommentThread,
  createComment,
} from "@inkandswitch/annotations-comments";

/** Styles */
import { createSignal, onMount, onCleanup } from "solid-js";
import { useSubscribe } from "@inkandswitch/subscribables-solid";
import { AnnotationSet } from "@inkandswitch/annotations";

export type TextDoc = {
  content: string;
};

const PATH = ["content"];

export function CodeMirrorEditor(props: PatchworkToolProps<TextDoc>) {
  const contentRef = () => (props.handle as DocHandle<TextDoc>).ref(...PATH);

  const isReadOnly = () => !!parseAutomergeUrl(props.handle.url).heads;

  // TODO: what if contentRef() is undefined?

  const contentAnnotations = globalAnnotations.onChildrenOf(contentRef());
  const diffAnnotations = useSubscribe(contentAnnotations.ofType(Diff));

  // Get all IsSelected annotations from global context (not just content children)
  // This allows CommentsView to highlight text by adding IsSelected to thread refs
  const allSelectionAnnotations = useSubscribe(
    globalAnnotations.ofType(IsSelected)
  );

  const commentAnnotations = useSubscribe(
    contentAnnotations.ofType(CommentThread)
  );

  // Check if a ref overlaps with any selected ref
  const isSelected = (targetRef: Ref) =>
    Array.from(allSelectionAnnotations()).some(([selectedRef]) =>
      selectedRef.overlaps(targetRef)
    );

  // compute decorations
  const decorations = () =>
    RangeSet.of<Decoration>(
      [
        // decorations for diffs
        ...Array.from(diffAnnotations()).flatMap(([ref, diff]) => {
          const [start, end] = ref.rangePositions!;

          if (diff.value.type === "deleted") {
            return Decoration.widget({
              widget: new DeletionMarker(
                diff.value.before as string,
                isSelected(ref)
              ),
              side: 1,
            }).range(start);
          }

          // Skip zero-length ranges for non-deletion diffs
          if (start === end) return [];

          if (diff.value.type === "added") {
            const isDarkMode = window.matchMedia(
              "(prefers-color-scheme: dark)"
            ).matches;
            return Decoration.mark({
              attributes: {
                style: `
                border-bottom: 2px solid ${isDarkMode ? "#4ade80" : "#22c55e"};
                background-color: ${
                  isSelected(ref)
                    ? isDarkMode
                      ? "#16a34a"
                      : "#86efac"
                    : isDarkMode
                      ? "#14532d"
                      : "#dcfce7"
                };
              `,
              },
            }).range(start, end);
          }

          return [];
        }),
        // decorations for comments
        ...Array.from(commentAnnotations()).flatMap(([ref]) => {
          const [start, end] = ref.rangePositions!;
          if (start === end) return [];
          const isDarkMode = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          const selected = isSelected(ref);
          return Decoration.mark({
            attributes: {
              style: `
                  border-bottom: 2px solid ${isDarkMode ? "#facc15" : "#eab308"};
                  background-color: ${
                    selected
                      ? isDarkMode
                        ? "#ca8a04"
                        : "#fde047"
                      : isDarkMode
                        ? "#713f12"
                        : "#fef9c3"
                  };
                `,
            },
          }).range(start, end);
        }),
      ],
      true // sort ranges
    );

  // Local annotation set for editor text selections
  const editorSelectionAnnotations = new AnnotationSet();
  globalAnnotations.add(editorSelectionAnnotations);

  onCleanup(() => {
    globalAnnotations.remove(editorSelectionAnnotations);
  });

  // handle selection changes - broadcast to annotation context
  const onChangeSelection = (from: number, to: number) => {
    editorSelectionAnnotations.change(() => {
      editorSelectionAnnotations.clear();

      const selectedRef = props.handle.ref(...PATH, cursor(from, to));
      editorSelectionAnnotations.add(selectedRef, IsSelected(true));
    });
  };

  // handle comment creation
  // todo: we should have a better way to get the contactUrl of the current account
  const onComment = async (from: number, to: number) => {
    const accountDoc = (window as any).accountDocHandle?.doc?.();
    const contactUrl = accountDoc?.contactUrl;
    if (!contactUrl) {
      console.warn("Cannot create comment: no contactUrl available");
      return;
    }
    createComment({
      refs: [props.handle.ref(...PATH, cursor(from, to))],
      content: "",
      contactUrl,
    });
  };

  // Base CodeMirror extensions (context-specific, not language-specific)
  const [extensions, setExtensions] = createSignal<Extension[]>([
    commentButtonGutter(onComment),
  ]);

  // Load CodeMirror extensions dynamically on mount
  onMount(async () => {
    // Get document type from handle
    const docType = (props.handle.doc() as any)?.["@patchwork"]?.type;

    // Load extensions that support this document type
    const extensionsRegistry = getRegistry<any>("codemirror:extension");

    const loadedExtensions = await extensionsRegistry.loadAll(
      extensionsRegistry.filter((ext) => {
        return (
          ext.supportedDatatypes === "*" ||
          (Array.isArray(ext.supportedDatatypes) &&
            ext.supportedDatatypes.includes(docType))
        );
      })
    );

    // Flatten and add to existing extensions
    const flattenedExts = loadedExtensions.flatMap((ext) => {
      const impl = ext.module;
      return Array.isArray(impl) ? impl : [impl];
    });

    setExtensions((exts) => [...exts, ...flattenedExts]);
  });

  return (
    <div class="w-full h-full overflow-auto bg-base">
      <div class="p-4 h-full">
        <div class="flex h-full">
          <div class="relative flex-1 h-full">
            <CodeMirror
              handle={props.handle as DocHandle<TextDoc>}
              path={PATH}
              decorations={decorations}
              extensions={extensions()}
              onChangeSelection={onChangeSelection}
              readOnly={isReadOnly()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

class DeletionMarker extends WidgetType {
  deletedText: string;
  isActive: boolean;

  constructor(deletedText: string, isActive: boolean) {
    super();
    this.deletedText = deletedText;
    this.isActive = isActive;
  }

  toDOM(): HTMLElement {
    const box = document.createElement("div");
    box.style.display = "inline-block";
    box.style.boxSizing = "border-box";
    box.style.padding = "0 2px";
    box.style.color = "rgb(239 68 68)"; // red-500
    box.style.margin = "0 4px";
    box.style.fontSize = "0.8em";
    box.style.backgroundColor = this.isActive
      ? "rgb(239 68 68 / 20%)" // red-500 with opacity
      : "rgb(239 68 68 / 10%)";
    box.style.borderRadius = "3px";
    box.style.cursor = "default";
    box.innerText = "⌫";

    const hoverText = document.createElement("div");
    hoverText.style.position = "absolute";
    hoverText.style.zIndex = "1";
    hoverText.style.padding = "5px";
    hoverText.style.backgroundColor = "rgb(254 242 242)"; // red-50
    hoverText.style.fontSize = "15px";
    hoverText.style.color = "rgb(17 24 39)"; // gray-900
    hoverText.style.border = "1px solid rgb(185 28 28)"; // red-700
    hoverText.style.boxShadow = "0px 0px 6px rgba(0, 0, 0, 0.1)";
    hoverText.style.borderRadius = "3px";
    hoverText.style.visibility = "hidden";
    hoverText.innerText = this.deletedText;

    // Add dark mode styles
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (isDarkMode) {
      box.style.color = "rgb(248 113 113)"; // red-400 for dark mode
      box.style.backgroundColor = this.isActive
        ? "rgb(248 113 113 / 20%)"
        : "rgb(248 113 113 / 10%)";
      hoverText.style.backgroundColor = "rgb(69 10 10)"; // red-950
      hoverText.style.color = "rgb(254 226 226)"; // red-100
      hoverText.style.border = "1px solid rgb(153 27 27)"; // red-800
    }

    box.appendChild(hoverText);

    box.onmouseover = function () {
      hoverText.style.visibility = "visible";
    };
    box.onmouseout = function () {
      hoverText.style.visibility = "hidden";
    };

    return box;
  }

  eq(other: DeletionMarker) {
    return (
      other.deletedText === this.deletedText && other.isActive === this.isActive
    );
  }

  ignoreEvent() {
    return true;
  }
}

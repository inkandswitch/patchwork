import { CodeMirror } from "./lib/codemirror.tsx";

/** CodeMirror Extensions */
import { RangeSet, type Extension } from "@codemirror/state";
import { Decoration, WidgetType } from "@codemirror/view";
import { commentButtonGutter } from "./lib/comments/commentButtonGutter.ts";

/** Automerge */
import type { PatchworkToolProps } from "./types.ts";
import { parseAutomergeUrl } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";

/** Patchwork */
import { createReactive, createSubcontext } from "@patchwork/context-solid";
import { PathRef, Ref, TextSpanRef } from "@patchwork/context";
import { $selectedRefs, IsSelected } from "@patchwork/context-selection";
import { createComment, getThreadsAt } from "@patchwork/context-comments";
import {
  type Diff,
  DiffAnnotation,
  getElementsWithDiff,
} from "@patchwork/context-diff";
import { getRegistry } from "@inkandswitch/patchwork-plugins";

/** Styles */
import { createSignal, onMount } from "solid-js";

export type TextDoc = {
  content: string;
};

const PATH = ["content"];

export function CodeMirrorEditor(props: PatchworkToolProps<TextDoc>) {
  if (!props.handle) {
    return;
  }
  const contentRef = () =>
    new PathRef(props.handle as DocHandle<TextDoc>, PATH);
  const isReadOnly = () => !!parseAutomergeUrl(props.handle.url).heads;

  // TODO: what if contentRef() is undefined?
  // diff references
  const elementsWithDiff = () => getElementsWithDiff(contentRef());
  const refsWithDiff = createReactive(() => elementsWithDiff());

  // comment references
  const commentThreads = () => getThreadsAt(contentRef());
  const refsWithComments = createReactive(() => commentThreads());

  // selection references
  const selectedRefs = createReactive($selectedRefs, false);
  const isSelected = (otherRef: Ref) => {
    return selectedRefs().some((ref) => ref.doesOverlap(otherRef));
  };

  // compute decorations
  const decorations = () =>
    RangeSet.of<Decoration>(
      [
        // decorations for diffs
        ...refsWithDiff().flatMap((ref) => {
          if (!(ref instanceof TextSpanRef)) return [];
          if (ref.from === ref.to) return [];
          const diff = ref.get(DiffAnnotation) as Diff<string>;

          if (diff.type === "deleted") {
            return Decoration.widget({
              widget: new DeletionMarker(diff.before, isSelected(ref)),
              side: 1,
            }).range(ref.from, ref.from);
          }

          if (diff.type === "added") {
            const isDarkMode = window.matchMedia(
              "(prefers-color-scheme: dark)"
            ).matches;
            const selected = isSelected(ref);
            return Decoration.mark({
              attributes: {
                style: `
                border-bottom: 2px solid ${isDarkMode ? "#4ade80" : "#22c55e"};
                background-color: ${
                  selected
                    ? isDarkMode
                      ? "#16a34a"
                      : "#86efac"
                    : isDarkMode
                      ? "#14532d"
                      : "#dcfce7"
                };
              `,
              },
            }).range(ref.from, ref.to);
          }

          return [];
        }),
        // decorations for comments
        ...(refsWithComments()
          ? refsWithComments().flatMap((ref) => {
              if (!(ref instanceof TextSpanRef)) return [];
              if (ref.from === ref.to) return [];
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
              }).range(ref.from, ref.to);
            })
          : []),
      ],
      true // sort ranges
    );

  // handle selection changes
  const selectionContext = createSubcontext();
  const onChangeSelection = (from: number, to: number) => {
    const selectedText = new TextSpanRef(
      props.handle as DocHandle<TextDoc>,
      PATH,
      from,
      to
    );
    selectionContext.replace([selectedText.with(IsSelected(true))]);
  };

  // handle comment creation
  const onComment = async (from: number, to: number) => {
    createComment({
      refs: [
        new TextSpanRef(props.handle as DocHandle<TextDoc>, PATH, from, to),
      ],
      content: "",
      authorId: (await props.repo.storageId())!,
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
          ext.supportedDataTypes === "*" ||
          (Array.isArray(ext.supportedDataTypes) &&
            ext.supportedDataTypes.includes(docType))
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

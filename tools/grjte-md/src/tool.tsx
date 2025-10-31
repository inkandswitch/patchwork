import { CodeMirror } from "./lib/codemirror.tsx";

/** CodeMirror Extensions */
import { completionKeymap } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { foldKeymap, indentOnInput, indentUnit } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { searchKeymap } from "@codemirror/search";
import { RangeSet } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  keymap,
  WidgetType,
} from "@codemirror/view";
import { commentButtonGutter } from "./lib/comments/commentButtonGutter";
import { underlineExtension } from "./lib/extensions/underline";

/** Automerge */
import type { PatchworkToolProps } from "./types.ts";
import { parseAutomergeUrl } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";

/** Patchwork */
import { createReactive, createSubcontext } from "@patchwork/context/solid";
import { PathRef, Ref, TextSpanRef } from "@patchwork/context";
import { $selectedRefs, IsSelected } from "@patchwork/context/selection";
import { createComment, getThreadsAt } from "@patchwork/context/comments";
import {
  type Diff,
  DiffAnnotation,
  getElementsWithDiff
} from "@patchwork/context/diff";

/** Styles */
import { theme } from "./theme.ts";

export type MarkdownDoc = {
  content: string;
};

const PATH = ["content"];

export function MarkdownEditor(props: PatchworkToolProps<MarkdownDoc>) {
  if (!props.handle) {
    return;
  }
  const contentRef = () => new PathRef(props.handle as DocHandle<MarkdownDoc>, PATH);
  const isReadOnly = () => !!parseAutomergeUrl(props.handle.url).heads

  // TODO: what if contentRef() is undefined?
  // diff references
  const elementsWithDiff = () => getElementsWithDiff(contentRef());
  const refsWithDiff = createReactive(() => elementsWithDiff());

  // comment references
  const commentThreads = () => getThreadsAt(contentRef());
  const refsWithComments = createReactive(() => commentThreads());

  // selection references
  const selectedRefs = createReactive($selectedRefs);
  const isSelected = (otherRef: Ref) => {
    return selectedRefs().some((ref) => ref.doesOverlap(otherRef));
  };

  // compute decorations
  const decorations = () => RangeSet.of<Decoration>([
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
          return Decoration.mark({
            class: `border-b border-green-500 dark:border-green-400 ${
              isSelected(ref)
                ? "bg-green-300 dark:bg-green-600"
                : "bg-green-100 dark:bg-green-900"
            }`,
          }).range(ref.from, ref.to);
        }

        return [];
      }),
      // decorations for comments
      ...(refsWithComments()
        ? refsWithComments().flatMap((ref) => {
          if (!(ref instanceof TextSpanRef)) return [];
          if (ref.from === ref.to) return [];
          return Decoration.mark({
              class: `border-b border-yellow-500 dark:border-yellow-400 ${
                isSelected(ref)
                  ? "bg-yellow-300 dark:bg-yellow-600"
                  : "bg-yellow-100 dark:bg-yellow-900"
              }`,
            }).range(ref.from, ref.to)
          })
        : []),
    ],
    true // sort ranges
  )

  // handle selection changes
  const selectionContext = createSubcontext();
  const onChangeSelection = (from: number, to: number) => {
    const selectedText = new TextSpanRef(props.handle as DocHandle<MarkdownDoc>, PATH, from, to);
    selectionContext.replace([selectedText.with(IsSelected(true))]);
  };

  // handle comment creation
  const onComment = async (from: number, to: number) => {
    createComment({
      refs: [new TextSpanRef(props.handle as DocHandle<MarkdownDoc>, PATH, from, to)],
      content: "",
      authorId: (await props.repo.storageId())!,
    });
  }

  // CodeMirror extensions for the Markdown editor
  const cmExtensions = [
    ...theme("sans"),
    history(),
    indentOnInput(),
    keymap.of([
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),
    EditorView.lineWrapping,
    markdown({ codeLanguages: languages }),
    indentUnit.of("    "),
    // Add the selection listener and comment button gutter
    commentButtonGutter(onComment),
    // Add the underline extension
    underlineExtension(),
  ];

  return (
    <div class="w-full h-full overflow-auto bg-base">
      <div class="p-4 h-full">
        <div class="flex h-full">
          <div class="relative flex-1 h-full">
            <CodeMirror
              handle={props.handle as DocHandle<MarkdownDoc>}
              path={PATH}
              decorations={decorations}
              extensions={cmExtensions}
              onChangeSelection={onChangeSelection}
              readOnly={isReadOnly()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

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
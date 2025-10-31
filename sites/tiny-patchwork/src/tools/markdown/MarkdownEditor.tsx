import { useDocHandle, useRepo } from "@automerge/automerge-repo-react-hooks";
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
import { EditorState, RangeSet } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  keymap,
  WidgetType,
} from "@codemirror/view";
import { useCallback, useMemo, useRef } from "react";
import { Codemirror } from "../../lib/codemirror";
import { useStaticCallback } from "../../lib/useStaticCallback";

import { parseAutomergeUrl } from "@automerge/automerge-repo";
import { PathRef, Reactive, Ref, TextSpanRef } from "@patchwork/context";
import { createComment, getThreadsAt } from "@patchwork/context/comments";
import {
  Diff,
  DiffAnnotation,
  getElementsWithDiff,
} from "@patchwork/context/diff";
import { useReactive, useSubcontext } from "@patchwork/context/react";
import { $selectedRefs, IsSelected } from "@patchwork/context/selection";
import { ReactToolProps } from "../../lib/toolify";
import { commentButtonGutter } from "./commentButtonGutter";
import { theme } from "./theme";

export type MarkdownDoc = {
  content: string;
};

const PATH = ["content"];

export const MarkdownEditor = ({ docUrl }: ReactToolProps) => {
  const repo = useRepo();
  const handle = useDocHandle<MarkdownDoc>(docUrl, { suspense: true });

  const cmContainerRef = useRef<HTMLDivElement | null>(null);
  const isReadOnly = parseAutomergeUrl(docUrl).heads !== undefined;

  const docHandle = useDocHandle<MarkdownDoc>(docUrl);
  const contentRef = useMemo(() => {
    if (!docHandle) {
      return undefined;
    }

    return new PathRef(docHandle, ["content"]);
  }, [docHandle]);

  const refsWithDiff = useReactive(
    useMemo(
      () =>
        (contentRef ? getElementsWithDiff(contentRef) : []) as Reactive<
          TextSpanRef[]
        >,
      [contentRef]
    )
  );

  const commentThreads = useMemo(
    () => (contentRef ? getThreadsAt(contentRef) : undefined),
    [contentRef]
  );
  const refsWithComments = useReactive(commentThreads) as TextSpanRef[];

  const selectedRefs = useReactive($selectedRefs);

  const isSelected = useCallback(
    (otherRef: Ref) => {
      return selectedRefs.some((ref) => ref.doesOverlap(otherRef));
    },
    [selectedRefs]
  );

  // compute decorations
  const decorations = useMemo<DecorationSet>(
    () =>
      RangeSet.of<Decoration>(
        [
          // diff
          ...refsWithDiff.flatMap((ref) => {
            const diff = ref.get(DiffAnnotation) as Diff<string>;

            if (diff.type === "deleted") {
              return makeDeleteDecoration({
                deletedText: diff.before,
                isActive: isSelected(ref),
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

          // comments
          ...(refsWithComments
            ? refsWithComments.flatMap((ref) =>
                ref.from !== ref.to
                  ? Decoration.mark({
                      class: `border-b border-yellow-500 dark:border-yellow-400 ${
                        isSelected(ref)
                          ? "bg-yellow-300 dark:bg-yellow-600"
                          : "bg-yellow-100 dark:bg-yellow-900"
                      }`,
                    }).range(ref.from, ref.to)
                  : []
              )
            : []),
        ],
        true // sort ranges
      ),
    [refsWithComments, refsWithDiff, isSelected]
  );

  const selectionContext = useSubcontext("MAKRDOWN_SELECTION");

  const onChangeSelection = useStaticCallback((from: number, to: number) => {
    if (!handle) {
      return;
    }

    const selectedText = new TextSpanRef(handle, ["content"], from, to);
    selectionContext.replace([selectedText.with(IsSelected(true))]);
  });

  const onComment = useStaticCallback(async (from: number, to: number) => {
    if (!handle) {
      return;
    }

    createComment({
      refs: [new TextSpanRef(handle, ["content"], from, to)],
      content: "",
      authorId: (await repo.storageId())!,
    });
  });

  const cmExtensions = useMemo(
    () => [
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
      isReadOnly
        ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
        : [],
      EditorView.lineWrapping,
      markdown({ codeLanguages: languages }),
      indentUnit.of("    "),
      // Add the selection listener and comment button gutter
      commentButtonGutter(onComment),
    ],
    [isReadOnly, onComment]
  );

  return (
    <div ref={cmContainerRef} className="relative flex-1 h-full flex">
      <Codemirror
        docUrl={docUrl}
        path={PATH}
        onChangeSelection={onChangeSelection}
        decorations={decorations}
        extensions={cmExtensions}
      />
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

const makeDeleteDecoration = ({
  deletedText,
  isActive,
}: {
  deletedText: string;
  isActive: boolean;
}) =>
  Decoration.widget({
    widget: new DeletionMarker(deletedText, isActive),
    side: 1,
  });

class TextSlipWidget extends WidgetType {
  text: string;

  constructor(text: string) {
    super();
    this.text = text;
  }

  toDOM(): HTMLElement {
    const box = document.createElement("span");
    box.style.display = "inline-block";
    box.style.boxSizing = "border-box";
    box.style.padding = "2px 6px";
    box.style.margin = "0 4px";
    box.style.fontSize = "0.85em";
    box.style.backgroundColor = "#fffdf5"; // slip of paper feel
    box.style.border = "1px solid #f1e9c6";
    box.style.boxShadow = "0 1px 2px rgba(0,0,0,0.06)";
    box.style.borderRadius = "4px";
    box.style.color = "#3c3c3c";
    box.style.fontFamily =
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

    // Add dark mode styles
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (isDarkMode) {
      box.style.backgroundColor = "#1f2937"; // gray-800
      box.style.border = "1px solid #374151"; // gray-700
      box.style.color = "#f3f4f6"; // gray-100
      box.style.boxShadow = "0 1px 2px rgba(0,0,0,0.3)";
    }

    box.textContent = this.text;
    return box;
  }

  eq(other: TextSlipWidget) {
    return other.text === this.text;
  }

  ignoreEvent() {
    return true;
  }
}

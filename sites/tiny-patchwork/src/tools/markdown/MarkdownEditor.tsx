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
import {
  PathRef,
  Reactive,
  Ref,
  TextSpanRef,
  TextSpanRefWith,
} from "@patchwork/context";
import {
  createComment,
  getThreadsAt,
  ThreadField,
} from "@patchwork/context/comments";
import { Diff, DiffValue, getElementsWithDiff } from "@patchwork/context/diff";
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
  const handle = useDocHandle<MarkdownDoc>(docUrl);

  const cmContainerRef = useRef<HTMLDivElement | null>(null);
  const isReadOnly = parseAutomergeUrl(docUrl).heads !== undefined;

  const docHandle = useDocHandle<MarkdownDoc>(docUrl);
  const contentRef = useMemo(() => {
    if (!docHandle) {
      return undefined;
    }

    return new PathRef(docHandle, ["content"]);
  }, [docHandle]);

  const val = useMemo(
    () =>
      (contentRef ? getElementsWithDiff(contentRef) : []) as Reactive<
        TextSpanRefWith<Diff>[]
      >,
    [contentRef]
  );
  const refsWithDiff = useReactive(val);

  const commentThreads = useMemo(() => getThreadsAt(contentRef), [contentRef]);
  const refsWithComments = useReactive(
    commentThreads
  ) as TextSpanRefWith<ThreadField>[];

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
            const diff = ref.get(Diff) as DiffValue<string>;

            if (diff.type === "deleted") {
              return makeDeleteDecoration({
                deletedText: diff.before,
                isActive: isSelected(ref),
              }).range(ref.from, ref.from);
            }

            if (diff.type === "added") {
              return Decoration.mark({
                class: `border-b border-green-300 ${
                  isSelected(ref) ? "bg-green-300" : "bg-green-100"
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
                      class: `border-b border-yellow-300 ${
                        isSelected(ref) ? "bg-yellow-300" : "bg-yellow-100"
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
      markdown({
        codeLanguages: languages,
      }),
      indentUnit.of("    "),
      // Add the selection listener and comment button gutter
      commentButtonGutter(onComment),
    ],
    [isReadOnly, onComment]
  );

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <div className="p-4 h-full">
        <div className="flex h-full">
          <div ref={cmContainerRef} className="relative flex-1 h-full">
            <Codemirror
              docUrl={docUrl}
              path={PATH}
              onChangeSelection={onChangeSelection}
              decorations={decorations}
              extensions={cmExtensions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// const parseMarkdownLinks = async (
//   repo: Repo,
//   handle: DocHandle<MarkdownDoc>
// ): Promise<TextSpanRefWith<Link>[]> => {
//   const docLinks: TextSpanRefWith<Link>[] = [];
//   // Single regex to match markdown links with the specific pattern: [text](anything--documentId) or [text](anything--documentId?params)
//   const regex = /\[([^\]]*)\]\(([^)]*)--([A-Za-z0-9_-]+)(\?[^)]*)?\)/g;
//   const content = handle.doc().content;

//   let match;
//   while ((match = regex.exec(content)) !== null) {
//     const fullMatch = match[0];
//     const documentId = match[3];
//     const from = match.index;
//     const to = match.index + fullMatch.length;

//     const docHandle = await repo.find(documentId as DocumentId);

//     docLinks.push(
//       new TextSpanRef(handle, ["content"], from, to).with(
//         Link({
//           ref: new PathRef(docHandle, []),
//         })
//       ) as TextSpanRefWith<Link>
//     );
//   }

//   return docLinks;
// };

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
    box.style.color = "rgb(236 35 35)";
    box.style.margin = "0 4px";
    box.style.fontSize = "0.8em";
    box.style.backgroundColor = this.isActive
      ? "rgb(255 0 0 / 20%)"
      : "rgb(255 0 0 / 10%)";
    box.style.borderRadius = "3px";
    box.style.cursor = "default";
    box.innerText = "⌫";

    const hoverText = document.createElement("div");
    hoverText.style.position = "absolute";
    hoverText.style.zIndex = "1";
    hoverText.style.padding = "10px";
    hoverText.style.backgroundColor = "rgb(255 230 230)";
    hoverText.style.fontSize = "15px";
    hoverText.style.color = "black";
    hoverText.style.padding = "5px";
    hoverText.style.border = "rgb(100 55 55)";
    hoverText.style.boxShadow = "0px 0px 6px rgba(0, 0, 0, 0.1)";
    hoverText.style.borderRadius = "3px";
    hoverText.style.visibility = "hidden";
    hoverText.innerText = this.deletedText;

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

const makeTextSlipDecoration = ({
  text,
  side,
}: {
  text: string;
  side: -1 | 1;
}) =>
  Decoration.widget({
    widget: new TextSlipWidget(text),
    side,
  });

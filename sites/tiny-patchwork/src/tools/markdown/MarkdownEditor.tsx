import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";
import {
  useDocHandle,
  useDocument,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
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
  DecorationSet,
  EditorView,
  WidgetType,
  keymap,
} from "@codemirror/view";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Codemirror } from "../../lib/codemirror";
import { useStaticCallback } from "../../lib/useStaticCallback";

//import { Diff, DiffValue, getRefsWithDiffAt } from "../../sdk/diff";
// import {
//   Extension,
//   useRefsWithExtensionsAt,
// } from "../../sdk/extensions";
// import { useSubcontext } from "../../sdk/context/react";
// import { Link } from "../../sdk/link";
// import { useReactive } from "../../sdk/reactive/react";
// import { SelectionAPI } from "../../sdk/selection";
// import { ToolProps } from "../../sdk/types";
import { theme } from "./theme";
import { ReactToolProps } from "../../lib/toolify";

export type MarkdownDoc = {
  content: string;
};

const PATH = ["content"];

export const MarkdownEditor = ({ docUrl }: ReactToolProps) => {
  const repo = useRepo();
  const [doc] = useDocument<MarkdownDoc>(docUrl);
  const handle = useDocHandle<MarkdownDoc>(docUrl);
  //  const { isSelected, setSelection, selectedRefs } = useReactive(SelectionAPI);
  const cmContainerRef = useRef<HTMLDivElement | null>(null);
  const [cmView, setCmView] = useState<EditorView | null>(null);
  const selectionRangeRef = useRef<{ from: number; to: number } | null>(null);
  const [commentBtnTop, setCommentBtnTop] = useState<number | null>(null);

  // todo:  another weird doc handle issue

  // const contentRef = useMemo(() => {
  //   // ignore hack
  //   if (!handle || (handle.doc() as any)["@patchwork"]?.type !== "markdown") {
  //     return undefined;
  //   }

  //   return new PathRef(handle, ["content"]);
  // }, [handle]);

  // parse links
  // const [docLinks, setDocLinks] = useState<TextSpanRefWith<Link>[]>([]);
  // useEffect(() => {
  //   let isCanceled = false;

  //   if (!handle) {
  //     setDocLinks([]);
  //     return;
  //   }

  //   parseMarkdownLinks(repo, handle).then((links) => {
  //     if (isCanceled) {
  //       return;
  //     }
  //     setDocLinks(links);
  //   });

  //   return () => {
  //     isCanceled = true;
  //   };
  // }, [repo, handle, doc]);

  // const docLinksContext = useSubcontext();

  // useEffect(
  //   () =>
  //     docLinksContext.replace(
  //       docLinks.flatMap((docLink) => [docLink, docLink.get(Link).ref])
  //     ),
  //   [docLinks, docLinksContext]
  // );

  // const refsWithExtensions = (
  //   contentRef
  // ) as TextSpanRefWith<Extension>[];

  // const refsWithDiff = useReactive(
  //   getRefsWithDiffAt(contentRef)
  // ) as TextSpanRefWith<Diff>[];

  // compute decorations
  // const decorations = useMemo<DecorationSet>(() => {
  //   return RangeSet.of<Decoration>(
  //     [
  //       // links
  //       ...docLinks.map((docLink) => {
  //         const isLinkSelected =
  //           isSelected(docLink) || isSelected(docLink.docRef);

  //         return Decoration.mark({
  //           class: isLinkSelected ? "bg-yellow-200" : "bg-yellow-100",
  //         }).range(docLink.from, docLink.to);
  //       }),

  //       // diff
  //       ...refsWithDiff.flatMap((ref) => {
  //         const diff = ref.get(Diff) as DiffValue<string>;

  //         if (diff.type === "deleted") {
  //           return makeDeleteDecoration({
  //             deletedText: diff.before,
  //             isActive: isSelected(ref),
  //           }).range(ref.from, ref.from);
  //         }

  //         if (diff.type === "added") {
  //           return Decoration.mark({
  //             class: `border-b border-green-300 ${
  //               isSelected(ref) ? "bg-green-300" : "bg-green-100"
  //             }`,
  //           }).range(ref.from, ref.to);
  //         }

  //         return [];
  //       }),

  //       // extensions as widgets (before | after | replace)
  //       // ...refsWithExtensions.flatMap((ref) => {
  //       //   const extension = ref.get(Extension);
  //       //   const slot = (extension.slot || "").toLowerCase();

  //       //   const from = ref.from;
  //       //   const to = ref.to;

  //       //   if (slot === "before") {
  //       //     return makeTextSlipDecoration({
  //       //       text: extension.value,
  //       //       side: -1,
  //       //     }).range(from, from);
  //       //   }

  //       //   if (slot === "replace") {
  //       //     return Decoration.replace({
  //       //       widget: new TextSlipWidget(extension.value),
  //       //       inclusive: true,
  //       //     }).range(from, to);
  //       //   }

  //       //   // default: render after
  //       //   return makeTextSlipDecoration({
  //       //     text: extension.value,
  //       //     side: 1,
  //       //   }).range(to, to);
  //       // }),

  //       // selection
  //       ...selectedRefs.flatMap((selectedRef) => {
  //         if (
  //           !(selectedRef instanceof TextSpanRef) ||
  //           !contentRef ||
  //           !selectedRef.isPartOf(contentRef) ||
  //           selectedRef.from === selectedRef.to
  //         ) {
  //           return [];
  //         }

  //         return Decoration.mark({
  //           class: "bg-blue-200",
  //         }).range(selectedRef.from, selectedRef.to);
  //       }),
  //     ],
  //     true // sort ranges
  //   );
  // }, [docLinks, refsWithDiff, selectedRefs, isSelected, contentRef]);

  const onChangeSelection = useStaticCallback((from: number, to: number) => {
    if (!handle) {
      return;
    }

    // const selectedText = new TextSpanRef(handle, ["content"], from, to);
    // const overlappingLinks = docLinks.filter((docLink) =>
    //   selectedText.doesOverlap(docLink)
    // );
    // const selectedObjects: Ref[] = [
    //   selectedText,
    //   ...overlappingLinks.map((docLink) => docLink.get(Link).ref),
    // ];

    // console.log(selectedObjects);

    // setSelection(selectedObjects);

    // // Track current selection range for comment button rendering
    // selectionRangeRef.current = { from, to };
    // recomputeCommentButtonPosition();
  });

  // Recompute comment button position using current selection and cmView
  const recomputeCommentButtonPosition = useStaticCallback(() => {
    if (!cmView || !cmContainerRef.current) {
      setCommentBtnTop(null);
      return;
    }
    const range = selectionRangeRef.current;
    if (!range || range.from === range.to) {
      setCommentBtnTop(null);
      return;
    }

    const coords = cmView.coordsAtPos(range.from);
    if (!coords) {
      setCommentBtnTop(null);
      return;
    }
    const containerRect = cmContainerRef.current.getBoundingClientRect();
    const top = coords.top - containerRect.top;
    setCommentBtnTop(top);
  });

  // Recompute on window resize
  useEffect(() => {
    const onResize = () => recomputeCommentButtonPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeCommentButtonPosition]);

  // Recompute when view becomes available
  useEffect(() => {
    recomputeCommentButtonPosition();
  }, [cmView, recomputeCommentButtonPosition]);

  // Recompute when doc hanges
  useEffect(() => {
    recomputeCommentButtonPosition();
  }, [doc?.content, recomputeCommentButtonPosition]);

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
      EditorView.lineWrapping,
      markdown({
        codeLanguages: languages,
      }),
      indentUnit.of("    "),
    ],
    []
  );

  return (
    <div className="w-full h-full overflow-auto">
      <div className="p-4">
        <div className="flex">
          <div ref={cmContainerRef} className="relative flex-1">
            <Codemirror
              docUrl={docUrl}
              path={PATH}
              onChangeSelection={onChangeSelection}
              decorations={Decoration.none}
              extensions={cmExtensions}
              viewRef={setCmView}
            />
          </div>
          <div className="relative w-8 ml-2">
            {commentBtnTop !== null && (
              <button
                type="button"
                className="hover:bg-gray-100 p-2 rounded-md"
                style={{ transform: `translateY(${commentBtnTop}px)` }}
                aria-label="Add comment"
              >
                <MessageCircle className="text-gray-500" size={20} />
              </button>
            )}
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

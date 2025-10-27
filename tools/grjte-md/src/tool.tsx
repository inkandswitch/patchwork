import { CodeMirror } from "./lib/codemirror.tsx";
import { createEffect, createMemo, createSignal, mapArray } from "solid-js";

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
import { Compartment, EditorState, RangeSet } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
} from "@codemirror/view";

/** Automerge */
import type { PatchworkToolProps } from "./types.ts";
import { parseAutomergeUrl } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";

/** Patchwork */
import { createReactive, createSubcontext } from "@patchwork/context/solid";
import { PathRef, Reactive, Ref, TextSpanRef } from "@patchwork/context";
import { $selectedRefs, IsSelected } from "@patchwork/context/selection";
import { createComment, getThreadsAt } from "@patchwork/context/comments";

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

  // TODO: diff references

  // comment references
  const commentThreads = () => getThreadsAt(contentRef())
  const refsWithComments = createReactive(() => commentThreads())

  // selection references
  const selectedRefs = createReactive($selectedRefs);
  const isSelected = (otherRef: Ref) => {
    return selectedRefs().some((ref) => ref.doesOverlap(otherRef));
  };

  // compute decorations
  const decorations = RangeSet.of<Decoration>([
      // TODO: decorations for diffs
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
    indentUnit.of("    ")
    // TODO: Add the selection listener and comment button gutter
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
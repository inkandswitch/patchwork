import type { Accessor } from "solid-js"
import type { DocHandle } from "@automerge/automerge-repo"
import { CodeMirror } from "@grjte/codemirror-base/component"
import { createEffect, createSignal, on, Show } from "solid-js"
import { javascript } from "@codemirror/lang-javascript"
import { noirTheme } from "./codemirror/theme.ts"
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands"
import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { tsFacet, tsAutocomplete, tsGoto, tsHover, tsLinterWorker, tsSync, tsTwoslash } from "@valtown/codemirror-ts"
import { autocompletion, completionKeymap, completionStatus } from "@codemirror/autocomplete"
import { vim } from "@replit/codemirror-vim"
import { bracketMatching, indentOnInput } from "@codemirror/language"
import { Compartment, EditorState } from "@codemirror/state"
import { search, searchKeymap } from "@codemirror/search"
import TenfoldDocs from "./docs.tsx"

type TextFile = { content: string }

export default function TenfoldEditor(props: {
  editing: Accessor<number | null>
  editingHandle: Accessor<DocHandle<TextFile> | undefined>
  typescriptPath: Accessor<string>
  fork: () => void
  worker: any
}) {
  const [withVim, setWithVim] = createSignal(false)

  const historyCompartment = new Compartment()

  const tsFacetCompartment = new Compartment()

  createEffect(() => {
    tsFacetCompartment.reconfigure(
      tsFacet.of({
        worker: props.worker,
        path: props.typescriptPath(),
      })
    )
  })

  return (
    <div>
      <Show when={props.editing() != null}>
        <button onClick={() => props.fork()}>New Letter</button>
      </Show>
      <Show when={props.editingHandle()}>
        <CodeMirror
          handle={props.editingHandle()}
          path={["content"]}
          withView={(view: EditorView) => {
            createEffect(
              on(props.typescriptPath, () => {
                view.dispatch({
                  effects: historyCompartment.reconfigure([]),
                })
                setTimeout(() => {
                  view.dispatch({
                    effects: historyCompartment.reconfigure(history()),
                  })
                }, 1000)
              })
            )
          }}
          extensions={[
            drawSelection(),
            withVim() ? vim({ status: true }) : [],
            EditorState.allowMultipleSelections.of(true),
            EditorView.clickAddsSelectionRange.of((event) => event.altKey),
            keymap.of([
              indentWithTab,
              {
                preventDefault: true,
                mac: "m-s",
                key: "c-s",
                run() {
                  return true
                },
              },
              {
                preventDefault: true,
                key: "m-c-v",
                run() {
                  setWithVim((prev) => !prev)
                  return true
                },
              },
              ...defaultKeymap,
              ...historyKeymap,
              ...completionKeymap,
              ...searchKeymap,
            ]),
            bracketMatching({}),
            historyCompartment.of([history()]),
            javascript(),
            noirTheme,
            tsFacetCompartment.of(tsFacet.of({ worker: props.worker, path: props.typescriptPath() })),
            autocompletion({
              override: [tsAutocomplete()],
              closeOnBlur: false,
            }),
            tsSync(),
            tsGoto(),
            tsHover(),
            tsTwoslash(),
            tsLinterWorker(),
            indentOnInput(),
            search({ caseSensitive: false, regexp: true }),
            EditorView.lineWrapping,
            EditorState.transactionFilter.of((tr) => {
              const start = completionStatus(tr.startState)
              const after = completionStatus(tr.state)

              if (
                !tr.reconfigured &&
                tr.changes.empty &&
                !tr.effects.length &&
                start == "active" &&
                !after &&
                !tr.scrollIntoView &&
                tr.startState.selection == tr.newSelection &&
                tr.selection == tr.startState.selection
              ) {
                return []
              }

              return tr
            }),
          ]}
        />
      </Show>
      <Show when={props.editing() == null}>
        <TenfoldDocs />
      </Show>
    </div>
  )
}

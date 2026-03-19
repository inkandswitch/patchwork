import type { DocHandle } from "@automerge/automerge-repo"
import { autocompletion, completionKeymap, completionStatus } from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands"
import { javascript } from "@codemirror/lang-javascript"
import { bracketMatching, indentOnInput } from "@codemirror/language"
import { search, searchKeymap } from "@codemirror/search"
import { Compartment, EditorState } from "@codemirror/state"
import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { CodeMirror } from "@grjte/codemirror-base/component"
import { vim } from "@replit/codemirror-vim"
import { tsAutocomplete, tsFacet, tsGoto, tsHover, tsLinterWorker, tsSync, tsTwoslash } from "@valtown/codemirror-ts"
import type { Accessor } from "solid-js"
import { createEffect, createSignal, on, Show } from "solid-js"
import { noirTheme } from "./codemirror/theme.ts"
import TenfoldDocs from "./docs.tsx"

type TextFile = { content: string }

export default function TenfoldEditor(props: {
  editing: Accessor<number | null>
  editingHandle: Accessor<DocHandle<TextFile> | undefined>
  typescriptPath: Accessor<string>
  fork: () => void
  worker: any
  hint: Accessor<string>
}) {
  const [withVim, setWithVim] = createSignal(false)
  const [showHints, setShowHints] = createSignal(true)

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
    <div id="dumb-tsx-container">
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
      <div class="tenfold-hint-bar">
        <label class="tenfold-hint-toggle">
          <input type="checkbox" checked={showHints()} onChange={(e) => setShowHints(e.currentTarget.checked)} />
          Hints
        </label>
        <Show when={showHints() && props.hint()}>
          <div class="tenfold-hint">{props.hint()}</div>
        </Show>
      </div>
    </div>
  )
}

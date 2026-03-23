import type { DocHandle } from "@automerge/automerge-repo"
import { autocompletion, completionKeymap, completionStatus } from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands"
import { javascript } from "@codemirror/lang-javascript"
import { indentOnInput } from "@codemirror/language"
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
  newLetter: () => void
  share: () => void
  deleteLetter: () => void
  toast: (msg: string) => void
  close: () => void
  worker: any
}) {
  const [withVim, setWithVim] = createSignal(false)
  let editorView: EditorView | undefined

  const historyCompartment = new Compartment()

  const tsFacetCompartment = new Compartment()

  // Keep last handle so CodeMirror stays mounted when toggling to docs
  const [lastHandle, setLastHandle] = createSignal<DocHandle<TextFile>>()
  createEffect(() => {
    const h = props.editingHandle()
    if (h) setLastHandle(() => h)
  })

  // Reset scroll when switching between letters
  createEffect(on(() => props.editing(), (curr, prev) => {
    if (curr != null && prev != null && curr !== prev && editorView) {
      editorView.scrollDOM.scrollTop = 0
    }
  }))

  createEffect(() => {
    tsFacetCompartment.reconfigure(
      tsFacet.of({
        worker: props.worker,
        path: props.typescriptPath(),
      })
    )
  })

  return (
    <aside>
      <canvas id="spark"></canvas>
      <div id="message-field"></div>
      <div id="synth-editor">
        <textarea></textarea>
      </div>
      <div style={{ display: props.editing() != null ? undefined : "none" }}>
        <div class="tenfold-button-row">
          <button class="tenfriend-button" onClick={() => props.newLetter()}>New Letter</button>
          <button class="tenfriend-button" onClick={() => props.share()}>Share Letter</button>
          <button class="tenfriend-button"
            onPointerDown={(e) => {
              const btn = e.currentTarget
              const start = Date.now()
              btn.classList.add("holding")
              const cleanup = () => {
                btn.classList.remove("holding")
                clearTimeout(holdTimer)
                window.removeEventListener("pointerup", onUp)
                window.removeEventListener("pointercancel", onUp)
              }
              const holdTimer = setTimeout(() => {
                cleanup()
                props.deleteLetter()
              }, 1300)
              const onUp = () => {
                cleanup()
                if (Date.now() - start < 300) props.toast("Press and hold to delete")
              }
              window.addEventListener("pointerup", onUp)
              window.addEventListener("pointercancel", onUp)
            }}
          >Delete Letter</button>
          <button class="tenfriend-button" onClick={() => props.close()}>X</button>
        </div>
      </div>
      <Show when={lastHandle()}>
        {(handle) => (
          <div style={{ display: props.editing() != null ? undefined : "none", flex: 1, "min-height": 0 }}>
            <CodeMirror
              handle={handle()}
              path={["content"]}
              withView={(view: EditorView) => {
                editorView = view
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
          </div>
        )}
      </Show>
      <div style={{ display: props.editing() == null ? undefined : "none", overflow: "auto", flex: 1 }}>
        <TenfoldDocs />
      </div>
    </aside>
  )
}

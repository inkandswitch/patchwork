import type { AutomergeUrl, Doc, DocHandle } from "@automerge/automerge-repo"
import type { Tenfold } from "./index.tsx"
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements"
import { makeDocumentProjection, useDocument } from "@automerge/automerge-repo-solid-primitives"
import { CodeMirror } from "@grjte/codemirror-base/component"
import createTenfold, { type CreateTenfoldOptions } from "./tenfold/tenfold.ts"
import { createMutable, createStore, produce } from "solid-js/store"
import { createEffect, createSignal, mapArray, on, onCleanup, onMount, Show, Suspense } from "solid-js"
import font from "./font.txt?raw"
import { javascript } from "@codemirror/lang-javascript"
import { noirTheme } from "./codemirror/theme.ts"
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands"
import { drawSelection, EditorView, keymap } from "@codemirror/view"
import { type WorkerShape } from "@valtown/codemirror-ts/worker"
import * as Comlink from "comlink"
import { tsFacet, tsAutocomplete, tsGoto, tsHover, tsLinterWorker, tsSync, tsTwoslash } from "@valtown/codemirror-ts"
import { autocompletion, completionKeymap, completionStatus } from "@codemirror/autocomplete"
import { vim } from "@replit/codemirror-vim"
import { bracketMatching, indentOnInput } from "@codemirror/language"
import { Compartment, EditorState } from "@codemirror/state"
import { search, searchKeymap } from "@codemirror/search"
import { addLoopBudgetInstrumentation } from "./instrumenter.ts"
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem"
import { makePersisted } from "@solid-primitives/storage"

const innerWorker = new Worker(new URL("./codemirror/worker.ts", import.meta.url), { type: "module" })
const worker = Comlink.wrap<WorkerShape>(innerWorker)
await worker.initialize()

function createCode(code: string) {
  const instrumented = addLoopBudgetInstrumentation(code)
  const fn = new Function(
    "ctx",
    "params",
    `with (Math) {with (ctx) {${instrumented}
}}`
  ) as unknown as CreateTenfoldOptions["letters"][number]
  return fn
}

function makeName(idx: number) {
  return (idx + "").padStart(2, "0") + ".js"
}

type TextFile = { content: string }

export default function TenfoldExperience(props: { handle: DocHandle<Tenfold>; element: PatchworkViewElement }) {
  const tenfold = makeDocumentProjection(props.handle) as Doc<Tenfold>

  createEffect(() => {
    if (!tenfold.tenfolder) {
      props.handle.change((doc) => {
        doc.tenfolder = "automerge:2c4E6m5u6rPWkeDxA6i1YWrAjTzD" as AutomergeUrl
      })
    }
  })

  const [tenfolder] = useDocument<FolderDoc>(() => tenfold.tenfolder, props.element)

  const [lettersFolder] = useDocument<FolderDoc>(() => tenfolder()?.docs.find((doc) => doc.name == "letters")?.url, props.element)

  const folders = mapArray(
    () =>
      lettersFolder()?.docs.toSorted((a, b) =>
        // compare in canadian
        a.name.localeCompare(b.name, "en-CA")
      ),
    (l) => l.name
  )

  const word = mapArray(folders, (name) => name[1])

  const counts = createMutable<number[]>([])
  const letterFolderHandles = createMutable<DocHandle<FolderDoc>[]>([])
  const codeHandles = createMutable<DocHandle<TextFile>[]>([])

  createEffect(() => {
    for (const [i, folderName] of Object.entries(folders())) {
      const letterIndex = +i
      createEffect(() => {
        delete codeHandles[letterIndex]
        const letterUrl = lettersFolder()?.docs.find((doc) => doc.name == folderName)?.url
        const [letterFolder, letterFolderHandle] = useDocument<FolderDoc>(letterUrl, props.element)
        counts[letterIndex] = letterFolder()?.docs.filter((doc) => doc.name.endsWith(".js")).length ?? -1
        letterFolderHandles[letterIndex] = letterFolderHandle()!
        const codeUrl = () => letterFolder()?.docs.find((doc) => doc.name == makeName(tenfold.states[letterIndex].i))?.url
        const [codeDoc, codeDocHandle] = useDocument<TextFile>(codeUrl, props.element)
        codeHandles[letterIndex] = codeDocHandle()!
        createEffect((prev: string | undefined) => {
          const content = codeDoc()?.content
          if (content == undefined) {
            setLetter(letterIndex, () => {})
            return
          }

          if (!prev || prev != content) {
            try {
              setLetter(+letterIndex, createCode(content))
            } catch (cause) {
              console.error(`error in ${folders()[+letterIndex].slice(1)?.toUpperCase()}${(tenfold.states[+letterIndex].i + "").padStart(2, "0")}`, cause)
              updateLetterFns(
                produce(
                  (letters) =>
                    (letters[+letterIndex] = () => {
                      throw new SyntaxError(cause instanceof Error ? cause.message : `${cause}`, { cause })
                    })
                )
              )
            }
          }
          return content
        })
      })
    }
  })

  const [editing, setEditing] = makePersisted(createSignal<number>(0), {
    name: `${props.handle.url}#editing`,
  })
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>()

  const [letterFns, updateLetterFns] = createStore<CreateTenfoldOptions["letters"]>(Array.from(Array(9)))

  function setLetter(idx: number, code: ReturnType<typeof createCode>) {
    updateLetterFns(produce((letters) => (letters[idx] = code)))
  }

  const tenfoldOptions = {
    letters: letterFns,
    get letterCounts() {
      return counts
    },
    get currentlyEditingIndex() {
      return editing()
    },
    font,
    get states() {
      return tenfold.states ?? []
    },
    get container() {
      return canvas()!
    },
    edit: setEditing,
    set(i, field, value) {
      props.handle.change((doc) => (doc.states[i][field] = value))
    },
    get word() {
      return word().join("").toUpperCase()
    },
  } satisfies CreateTenfoldOptions

  createEffect(
    on(word, (word) => {
      if (word && word.length) {
        onCleanup(createTenfold(tenfoldOptions))
      }
    })
  )

  onMount(() => {
    canvas()!.addEventListener("tenfold:edit", (event) => {
      setEditing((event as CustomEvent<number>).detail || 0)
    })
  })

  const editingHandle = () => codeHandles[editing()]

  const typescriptPath = () => `/letters/${folders()[editing()]}/${tenfold.states[editing()].i}.js`

  async function fork() {
    const idx = editing()
    const hdl = letterFolderHandles[idx]
    const len = counts[idx]
    const name = (len + "").padStart(2, "0") + ".js"

    const newDoc = await props.element.repo.create2({
      "@patchwork": { type: "file" },
      mimeType: "application/javascript",
      extension: "js",
      metadata: { permissions: 420 },
      content: codeHandles[idx].doc().content ?? "",
      name,
    })

    hdl.change((folder) => {
      folder.docs.push({
        type: "file",
        url: newDoc.url,
        name,
      })
    })

    props.handle.change((doc) => (doc.states[idx].i = len))
  }

  const [withVim, setWithVim] = createSignal(false)

  const historyCompartment = new Compartment()

  const tsFacetCompartment = new Compartment()

  createEffect(() => {
    tsFacetCompartment.reconfigure(
      tsFacet.of({
        worker,
        path: typescriptPath(),
      })
    )
  })

  createEffect(() => {
    if (isNaN(tenfold.states[editing()].i)) {
      props.handle.change((t) => {
        t.states[editing()].i = 0
      })
    }
  })

  return (
    <Suspense>
      <article class="tenfold" ref={setCanvas}>
        <canvas />
        <aside>
          <canvas id="spark"></canvas>
          <div id="message-field"></div>
          <div id="synth-editor">
            <textarea></textarea>
          </div>
          <div>
            <button onClick={() => fork()}>New Letter</button>
            <Show when={editingHandle()}>
              <CodeMirror
                handle={editingHandle()}
                path={["content"]}
                withView={(view: EditorView) => {
                  createEffect(
                    on(typescriptPath, () => {
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
                  tsFacetCompartment.of(tsFacet.of({ worker, path: typescriptPath() })),
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
          </div>
        </aside>
      </article>
    </Suspense>
  )
}

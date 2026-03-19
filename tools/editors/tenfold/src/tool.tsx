import type { AutomergeUrl, Doc, DocHandle } from "@automerge/automerge-repo"
import { makeDocumentProjection, useDocument } from "@automerge/automerge-repo-solid-primitives"
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements"
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem"
import { makePersisted } from "@solid-primitives/storage"
import { type WorkerShape } from "@valtown/codemirror-ts/worker"
import * as Comlink from "comlink"
import { createEffect, createSignal, mapArray, on, onMount, Suspense } from "solid-js"
import { createMutable, createStore, produce } from "solid-js/store"
import TenfoldEditor from "./editor.tsx"
import font from "./font.txt?raw"
import type { Tenfold } from "./index.tsx"
import { addLoopBudgetInstrumentation } from "./instrumenter.ts"
import createTenfold, { type CreateTenfoldOptions } from "./tenfold/tenfold.ts"

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

  const [hint, setHint] = createSignal("")

  const [editing, setEditing] = makePersisted(createSignal<number | null>(null), {
    name: `${props.handle.url}#editing`,
  })

  function toggleEditing(i: number) {
    setEditing((prev) => (prev === i ? null : i))
  }
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
    edit: toggleEditing,
    set(i, field, value) {
      props.handle.change((doc) => (doc.states[i][field] = value))
    },
    get word() {
      return word().join("").toUpperCase()
    },
    onHover: setHint,
  } satisfies CreateTenfoldOptions

  createEffect(
    on(word, (word) => {
      if (word && word.length) {
        createTenfold(tenfoldOptions)
      }
    })
  )

  onMount(() => {
    canvas()!.addEventListener("tenfold:edit", (event) => {
      toggleEditing((event as CustomEvent<number>).detail || 0)
    })
  })

  const editingHandle = () => {
    const idx = editing()
    return idx != null ? codeHandles[idx] : undefined
  }

  const typescriptPath = () => {
    const idx = editing()
    return idx != null ? `/letters/${folders()[idx]}/${tenfold.states[idx].i}.js` : ""
  }

  async function fork() {
    const idx = editing()
    if (idx == null) return
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

  createEffect(() => {
    const idx = editing()
    if (idx != null && isNaN(tenfold.states[idx].i)) {
      props.handle.change((t) => {
        t.states[idx].i = 0
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
          <TenfoldEditor editing={editing} editingHandle={editingHandle} typescriptPath={typescriptPath} fork={fork} worker={worker} hint={hint} />
        </aside>
      </article>
    </Suspense>
  )
}

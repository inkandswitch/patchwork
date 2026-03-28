import { ImmutableString, type AutomergeUrl, type Doc, type DocHandle } from "@automerge/automerge-repo"
import { makeDocumentProjection, useDocument, useDocHandle } from "@automerge/automerge-repo-solid-primitives"
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements"
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem"
import { makePersisted } from "@solid-primitives/storage"
import { type WorkerShape } from "@valtown/codemirror-ts/worker"
import * as Comlink from "comlink"
import { createEffect, createResource, createSignal, mapArray, on, onMount, Suspense } from "solid-js"
import { createMutable, createStore, produce } from "solid-js/store"
import TenfoldEditor from "./editor.tsx"
import font from "./font.txt?raw"
import type { Tenfold } from "./index.tsx"
import { addLoopBudgetInstrumentation } from "./instrumenter.ts"
import createTenfold, { type CreateTenfoldOptions } from "./tenfold/tenfold.ts"

const innerWorker = new Worker(new URL("./codemirror/worker.ts", import.meta.url), { type: "module" })
const worker = Comlink.wrap<WorkerShape>(innerWorker)
await worker.initialize()

const sharedLettersUrl = "automerge:45iRPYFD1u7UwMcyGSRw6ypsvLNE" as AutomergeUrl

const cuteId = () => Math.random().toString(36).slice(2)

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

declare global {
  interface Window {
    Automerge: typeof import("@automerge/automerge")
    AutomergeRepo: typeof import("@automerge/automerge-repo")
    repo: import("@automerge/automerge-repo").Repo
  }
}

async function coshare(tenfolderUrl: AutomergeUrl) {
  // Handle ?letter=&share= URLs: import shared letter code.
  // Read params once, store in a signal, then wait for data to be ready.
  const params = new URLSearchParams(window.location.search)
  let share = params.get("letter") && params.get("share") ? { letter: params.get("letter")!, shareId: params.get("share")! } : null
  if (!share) return

  const tenfolderHandle = await self.repo.find<FolderDoc>(tenfolderUrl)
  const lettersFolderHandle = await self.repo.find<FolderDoc>(tenfolderHandle.doc().docs.find((doc) => doc.name == "letters")?.url!)
  const letterFolderHandle = await self.repo.find<FolderDoc>(lettersFolderHandle.doc().docs.find((doc) => doc.name == share.letter)?.url!)
  const indexInLetter = letterFolderHandle.doc().docs.filter((doc) => doc.name.endsWith(".js")).length
  const registryHandle = await self.repo.find<Record<string, ImmutableString>>(sharedLettersUrl)
  const registry = registryHandle.doc()
  if (!(share.shareId in registry)) {
    alert("Shared letter not found. It may have been deleted, or the share ID may be incorrect.")
    return
  }
  const code = registry[share.shareId]
  const name = (indexInLetter + "").padStart(2, "0") + ".js"

  const newDoc = self.repo.create({
    "@patchwork": { type: "file" },
    mimeType: "application/javascript",
    extension: "js",
    metadata: { permissions: 420 },
    content: code.toString(),
    name,
  })

  letterFolderHandle.change((folder) =>
    folder.docs.push({
      type: "file",
      url: newDoc.url,
      name,
    })
  )

  const cleanUrl = new URL(window.location.href)
  cleanUrl.searchParams.delete("letter")
  cleanUrl.searchParams.delete("share")
  window.history.replaceState({}, "", cleanUrl.toString())

  return [+share.letter[0], indexInLetter]
}

export default function TenfoldExperience(props: { handle: DocHandle<Tenfold>; element: PatchworkViewElement }) {
  const tenfold = makeDocumentProjection(props.handle) as Doc<Tenfold>

  // Eagerly load the shared letters registry so it's ready for share/import
  const sharedLettersHandle = useDocHandle(() => sharedLettersUrl, { repo: props.element.repo })

  const [coshareResource] = createResource(() => tenfold.tenfolder, coshare)

  const coshareIndex = () => coshareResource()

  // really sorry about the variable names in this function
  // i've slept about 18 hours in the past week, and they were all on tuesday
  createEffect(() => {
    const coindex = coshareIndex()
    if (coindex != null) {
      const [letterNumber, letterIndex] = coindex
      props.handle.change((doc) => {
        doc.states[letterNumber].i = letterIndex
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

  const [toastMessage, setToastMessage] = createSignal("")
  let toastTimer: ReturnType<typeof setTimeout>
  function toast(msg: string) {
    setToastMessage("")
    clearTimeout(toastTimer)
    queueMicrotask(() => {
      setToastMessage(msg)
      toastTimer = setTimeout(() => setToastMessage(""), 2000)
    })
  }

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

  function newLetter() {
    const idx = editing()
    if (idx == null) return
    const hdl = letterFolderHandles[idx]
    const len = counts[idx]
    const name = (len + "").padStart(2, "0") + ".js"

    const newDoc = props.element.repo.create({
      "@patchwork": { type: "file" },
      mimeType: "application/javascript",
      extension: "js",
      metadata: { permissions: 420 },
      content: `// Untitled ${folders()[idx][1].toUpperCase()} <0x${Math.floor(Math.random() * 0x10000)
        .toString(16)
        .padStart(4, "0")}>\n// by ${tenfold.name}\n\nrect()\ncircle()\n\nrotaten(params.x)\n\nline( 0, -1)\nline( 0,  1)\nmove(-1,  0)\nline( 1,  0)\n`,
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

  async function deleteLetter() {
    const idx = editing()
    if (idx == null) return
    const hdl = letterFolderHandles[idx]
    const si = tenfold.states[idx].i

    if (counts[idx] <= 1) await newLetter()

    const name = makeName(si)
    hdl.change((folder) => {
      const i = folder.docs.findIndex((doc) => doc.name === name)
      if (i !== -1) folder.docs.splice(i, 1)
      // Rename subsequent files to close the gap
      for (const doc of folder.docs) {
        if (!doc.name.endsWith(".js")) continue
        const num = parseInt(doc.name)
        if (num > si) doc.name = makeName(num - 1)
      }
    })
    const newI = si >= counts[idx] - 1 ? Math.max(0, si - 1) : si
    props.handle.change((doc) => (doc.states[idx].i = newI))
  }

  function share() {
    const idx = editing()
    if (idx == null) return
    const code = codeHandles[idx]?.doc()?.content
    if (!code) return
    const registry = sharedLettersHandle()
    if (!registry) return toast("Still loading, try again")
    const id = cuteId()
    const letterName = folders()[idx]
    registry.change((d: any) => (d[id] = new ImmutableString(code)))

    const url = new URL("/", window.location.origin)
    url.searchParams.set("letter", letterName)
    url.searchParams.set("share", id)

    navigator.clipboard.writeText(url.href)
    toast("Copied to clipboard")
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
        {toastMessage() && <div class="tenfold-toast">{toastMessage()}</div>}
        <canvas />
        <TenfoldEditor
          editing={editing}
          editingHandle={editingHandle}
          typescriptPath={typescriptPath}
          newLetter={newLetter}
          share={share}
          deleteLetter={deleteLetter}
          toast={toast}
          close={() => setEditing(null)}
          worker={worker}
        />
      </article>
    </Suspense>
  )
}

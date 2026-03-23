import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo"
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements"
import { getRegistry } from "@inkandswitch/patchwork-plugins"
import { createSignal } from "solid-js"
import { render } from "solid-js/web"
import type { TenfriendDoc } from "./tenfriend-datatype"

const tenfriendRegistryUrl = "automerge:3qUerKfy4MQp7kbyuwFEt8JoHVSr" as AutomergeUrl

const letterFolders = ["0i", "1n", "2k", "3s", "4w", "5i", "6t", "7c", "8h"]

const letterFileUrls: Record<string, Record<string, URL>> = {
  "0i": {
    "00.js": new URL("../TENFOLDER/letters/0i/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/0i/01.js", import.meta.url),
  },
  "1n": {
    "00.js": new URL("../TENFOLDER/letters/1n/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/1n/01.js", import.meta.url),
  },
  "2k": {
    "00.js": new URL("../TENFOLDER/letters/2k/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/2k/01.js", import.meta.url),
  },
  "3s": {
    "00.js": new URL("../TENFOLDER/letters/3s/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/3s/01.js", import.meta.url),
    "02.js": new URL("../TENFOLDER/letters/3s/02.js", import.meta.url),
  },
  "4w": {
    "00.js": new URL("../TENFOLDER/letters/4w/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/4w/01.js", import.meta.url),
  },
  "5i": {
    "00.js": new URL("../TENFOLDER/letters/5i/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/5i/01.js", import.meta.url),
    "02.js": new URL("../TENFOLDER/letters/5i/02.js", import.meta.url),
  },
  "6t": {
    "00.js": new URL("../TENFOLDER/letters/6t/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/6t/01.js", import.meta.url),
  },
  "7c": {
    "00.js": new URL("../TENFOLDER/letters/7c/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/7c/01.js", import.meta.url),
  },
  "8h": {
    "00.js": new URL("../TENFOLDER/letters/8h/00.js", import.meta.url),
    "01.js": new URL("../TENFOLDER/letters/8h/01.js", import.meta.url),
  },
}

const patchFileUrls: Record<string, Record<string, URL>> = {
  "0i": { "00.as": new URL("../TENFOLDER/patches/0i/00.as", import.meta.url) },
  "1n": { "00.as": new URL("../TENFOLDER/patches/1n/00.as", import.meta.url) },
  "2k": { "00.as": new URL("../TENFOLDER/patches/2k/00.as", import.meta.url) },
  "3s": { "00.as": new URL("../TENFOLDER/patches/3s/00.as", import.meta.url) },
  "4w": { "00.as": new URL("../TENFOLDER/patches/4w/00.as", import.meta.url) },
  "5i": { "00.as": new URL("../TENFOLDER/patches/5i/00.as", import.meta.url) },
  "6t": { "00.as": new URL("../TENFOLDER/patches/6t/00.as", import.meta.url) },
  "7c": { "00.as": new URL("../TENFOLDER/patches/7c/00.as", import.meta.url) },
  "8h": { "00.as": new URL("../TENFOLDER/patches/8h/00.as", import.meta.url) },
}

async function createTenfolder(name: string, repo: Repo): Promise<AutomergeUrl> {
  const rootHandle = await repo.create2({ "@patchwork": { type: "folder" }, title: name, docs: [] } as any)
  const lettersHandle = await repo.create2({ "@patchwork": { type: "folder" }, title: "letters", docs: [] } as any)
  const patchesHandle = await repo.create2({ "@patchwork": { type: "folder" }, title: "patches", docs: [] } as any)

  for (const folderName of letterFolders) {
    // Create letter files
    const letterDocs: { name: string; type: string; url: AutomergeUrl }[] = []
    for (const [fileName, fileUrl] of Object.entries(letterFileUrls[folderName])) {
      const content = await fetch(fileUrl).then((r) => r.text())
      const fileHandle = await repo.create2({ "@patchwork": { type: "file" }, name: fileName, extension: ".js", mimeType: "text/javascript", content } as any)
      letterDocs.push({ name: fileName, type: "file", url: fileHandle.url })
    }

    const letterFolderHandle = await repo.create2({ "@patchwork": { type: "folder" }, title: folderName, docs: letterDocs } as any)

    lettersHandle.change((d: any) => {
      d.docs.push({ name: folderName, type: "folder", url: letterFolderHandle.url })
    })

    // Create patch files
    const patchDocs: { name: string; type: string; url: AutomergeUrl }[] = []
    for (const [fileName, fileUrl] of Object.entries(patchFileUrls[folderName])) {
      const content = await fetch(fileUrl).then((r) => r.text())
      const fileHandle = await repo.create2({ "@patchwork": { type: "file" }, name: fileName, extension: ".as", mimeType: "text/plain", content } as any)
      patchDocs.push({ name: fileName, type: "file", url: fileHandle.url })
    }

    const patchFolderHandle = await repo.create2({ "@patchwork": { type: "folder" }, title: folderName, docs: patchDocs } as any)

    patchesHandle.change((d: any) => d.docs.push({ name: folderName, type: "folder", url: patchFolderHandle.url }))
  }

  rootHandle.change((d: any) => {
    d.docs.push({ name: "letters", type: "folder", url: lettersHandle.url }, { name: "patches", type: "folder", url: patchesHandle.url })
  })

  return rootHandle.url
}

function NewTenfriendPrompt(props: { handle: DocHandle<TenfriendDoc>; element: PatchworkViewElement }) {
  let inputRef!: HTMLInputElement
  const [creating, setCreating] = createSignal(false)

  async function submit() {
    const name = inputRef.value.trim()
    if (!name || creating()) return

    setCreating(true)

    try {
      const repo = props.element.repo
      const tenfolderUrl = await createTenfolder(name, repo)

      // Load the tenfold datatype so we can call its init
      const registry = getRegistry("patchwork:datatype")
      const tenfoldDatatype = await registry.load("inkandswitch/tenfold")

      props.handle.change((d: any) => {
        // Init the doc with tenfold's expected shape
        tenfoldDatatype?.module?.init?.(d, repo)
        d["@patchwork"].type = "inkandswitch/tenfold"
        d.tenfolder = tenfolderUrl
        d.name = name
      })

      // Register this tenfriend in the registry doc
      const registryHandle = await repo.find(tenfriendRegistryUrl)
      await registryHandle.whenReady()
      registryHandle.change((d: any) => (d[props.handle.url] = name))

      // Flush to IndexedDB before navigating away
      await repo.flush()

      // Navigate to the tenfold view with the doc
      const url = new URL(window.location.href)
      url.searchParams.set("doc", props.handle.url)
      window.location.href = url.toString()
    } catch (err) {
      console.error("Failed to create tenfriend:", err)
      setCreating(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div class="tenfriend-prompt">
      <label class="tenfriend-label" for="tenfriend-name">
        WHAT NAME MAY WE USE TO CREDIT YOU?
      </label>
      <div class="tenfriend-row">
        <input ref={inputRef!} class="tenfriend-input" id="tenfriend-name" type="text" autofocus disabled={creating()} onKeyDown={onKeyDown} />
        <button class="tenfriend-button" onClick={submit} disabled={creating()}>
          OK
        </button>
      </div>
    </div>
  )
}

export function TenfriendTool(handle: DocHandle<TenfriendDoc>, element: PatchworkViewElement) {
  const dispose = render(() => <NewTenfriendPrompt handle={handle} element={element} />, element)
  return () => dispose()
}

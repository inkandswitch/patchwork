import type {
  AutomergeUrl,
  Doc,
  DocHandle,
} from "@automerge/automerge-repo/slim"
import useDocHandle from "./useDocHandle.js"
import type { MaybeAccessor, UseDocHandleOptions } from "./types.js"
import { createEffect, onCleanup, type Accessor, type Resource } from "solid-js"
import { createSignal } from "solid-js"

/**
 * get a coarse-grained live view of a document
 * @param url a function that returns a url
 */
export default function useDocSignal<T extends object>(
  url: MaybeAccessor<AutomergeUrl | undefined>,
  options?: UseDocHandleOptions
): [Accessor<Doc<T> | undefined>, Resource<DocHandle<T> | undefined>] {
  const handle = useDocHandle<T>(url, options)
  const [signal, setSignal] = createSignal<Doc<T> | undefined>(handle()?.doc())

  createEffect(() => {
    const h = handle()

    function update() {
      setSignal(() => h?.doc() as Doc<T> | undefined)
    }

    // sync the signal with the current handle's doc
    update()

    if (h) {
      h.on("change", update)
      onCleanup(() => h.off("change", update))
    }
  })

  return [signal, handle] as const
}

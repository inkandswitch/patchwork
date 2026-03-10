import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { createSignal, createEffect, onCleanup, Accessor } from "solid-js";

/**
 * SolidJS hook to reactively subscribe to multiple Automerge documents by URL.
 * Returns a reactive Map<AutomergeUrl, T> that updates when any document changes.
 */
export function useDocuments<T>(
  urlsAccessor: Accessor<AutomergeUrl[]>,
  repo: Repo
) {
  const [docsMap, setDocsMap] = createSignal<Map<AutomergeUrl, T>>(new Map());

  createEffect(() => {
    const urls = urlsAccessor();
    const handlers = new Map<
      AutomergeUrl,
      { handle: any; onChange: (payload: any) => void }
    >();

    urls.forEach((url) => {
      repo.find<T>(url).then((handle) => {
        if (handle.doc()) {
          setDocsMap((prev) => {
            const updated = new Map(prev);
            updated.set(url, handle.doc()!);
            return updated;
          });
        }

        const onChange = ({ doc }: { doc: T }) => {
          if (doc) {
            setDocsMap((prev) => {
              const updated = new Map(prev);
              updated.set(url, doc);
              return updated;
            });
          }
        };

        handle.on("change", onChange);
        handlers.set(url, { handle, onChange });
      });
    });

    onCleanup(() => {
      handlers.forEach(({ handle, onChange }) => {
        handle.off("change", onChange);
      });
    });
  });

  return [docsMap] as const;
}

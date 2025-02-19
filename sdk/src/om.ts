import {
  AutomergeUrl,
  Doc,
  DocHandle,
  DocumentId,
  parseAutomergeUrl,
  Repo,
} from "@automerge/automerge-repo";
import {
  useDocument,
  useDocHandles,
  useRepo,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import { compact } from "lodash-es";

export type Om<T = unknown> = {
  url: AutomergeUrl;
  id: DocumentId;
  handle: DocHandle<T>;
  doc: Doc<T>;
};

export type Omable<T = unknown> = AutomergeUrl | DocHandle<T>;

export async function om<T>(omable: Omable<T>, repo: Repo): Promise<Om<T>> {
  const url = typeof omable === "string" ? omable : omable.url;
  const id = parseAutomergeUrl(url).documentId;
  const handle = await repo.find<T>(url);
  const doc = handle.doc();
  return { url, id, handle, doc };
}

export function useOm<T>(omable: Omable<T> | undefined): Om<T> | undefined {
  const url = !omable
    ? undefined
    : typeof omable === "string"
    ? omable
    : omable.url;
  const id = !url ? undefined : parseAutomergeUrl(url).documentId;
  const handle = useDocHandle<T>(url);
  const [doc] = useDocument<T>(url);

  return url && id && handle && doc && { url, id, handle, doc };
}

export function useOms<T>(
  omables: (Omable<T> | undefined)[]
): (Om<T> | undefined)[] {
  const repo = useRepo();
  const urls = omables.map(
    (omable) => omable && (typeof omable === "string" ? omable : omable.url)
  );
  const handles = useDocHandles(compact(urls));

  return Object.entries(handles).map(([url, handle]) => {
    return (
      handle && {
        url: handle.url,
        id: handle.documentId,
        handle,
        doc: handle.doc(),
      }
    );
  });
}

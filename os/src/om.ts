import { AutomergeUrl, Doc, DocHandle, DocumentId, parseAutomergeUrl, Repo } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocuments,
  useHandle,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";

export type Om<T = unknown> = {
  url: AutomergeUrl,
  id: DocumentId,
  handle: DocHandle<T>,
  doc: Doc<T>,
};

export type Omable<T = unknown> = AutomergeUrl | DocHandle<T>;

export async function om<T>(omable: Omable<T>, repo: Repo): Promise<Om<T>> {
  const url = typeof omable === "string" ? omable : omable.url;
  const id = parseAutomergeUrl(url).documentId;
  const handle = repo.find<T>(url);
  const doc = await handle.doc();
  return { url, id, handle, doc };
}

export function useOm<T>(omable: Omable<T> | null): Om<T> | null {
  const url = !omable ? null : typeof omable === "string" ? omable : omable.url;
  const id = !url ? null : parseAutomergeUrl(url).documentId;
  const handle = useHandle<T>(url);
  const [ doc ] = useDocument<T>(url);

  return url && id && handle && doc && { url, id, handle, doc };
}

export function useOms<T>(omables: (Omable<T> | null)[]): Om<T>[] {
  const repo = useRepo();
  const urls = omables.map((omable) => omable && (typeof omable === "string" ? omable : omable.url));
  const ids = urls.map((url) => url && parseAutomergeUrl(url).documentId);
  const handles = urls.map((url) => url && repo.find<T>(url));
  const docs = useDocuments<T>(urls.filter(Boolean));

  return urls.map((url, i) => {
    const id = ids[i];
    const handle = handles[i];
    const doc = docs[ids[i]];
    return url && id && handle && doc && { url, id, handle, doc };
  });
}

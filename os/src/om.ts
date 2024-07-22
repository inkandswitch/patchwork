import { AutomergeUrl, Doc, DocHandle, DocumentId, parseAutomergeUrl, Repo } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocuments,
  useHandle,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import { compact } from "lodash";

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
  if (!doc) { throw new Error(`Document not found: ${url}`); }
  return { url, id, handle, doc };
}

export function useOm<T>(omable: Omable<T> | undefined): Om<T> | undefined {
  const url = !omable ? undefined : typeof omable === "string" ? omable : omable.url;
  const id = !url ? undefined : parseAutomergeUrl(url).documentId;
  const handle = useHandle<T>(url);
  const [ doc ] = useDocument<T>(url);

  return url && id && handle && doc && { url, id, handle, doc };
}

export function useOms<T>(omables: (Omable<T> | undefined)[]): (Om<T> | undefined)[] {
  const repo = useRepo();
  const urls = omables.map((omable) => omable && (typeof omable === "string" ? omable : omable.url));
  const ids = urls.map((url) => url && parseAutomergeUrl(url).documentId);
  const handles = urls.map((url) => url && repo.find<T>(url));
  const docs = useDocuments<T>(compact(urls));

  return urls.map((url, i) => {
    const id = ids[i];
    const handle = handles[i];
    const doc = ids[i] && docs[ids[i]];
    return url && id && handle && doc && { url, id, handle, doc };
  });
}

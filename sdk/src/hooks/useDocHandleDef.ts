import { AnyDocumentId, DocHandle } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";

/** automerge-repo's "useDocHandle" accepts & returns undefineds; this one doesn't */
export function useDocHandleDef<T>(id: AnyDocumentId): DocHandle<T> {
  const repo = useRepo();
  return repo.find<T>(id);
}

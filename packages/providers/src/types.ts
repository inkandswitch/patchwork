import type {
  AnyDocumentId,
  DocHandle,
  DocumentId,
} from "@automerge/automerge-repo";

/**
 * Minimal repo surface that both the real `Repo` and overlay repos (e.g.
 * `WorkspaceRepo`) can satisfy. Consumers requesting `patchwork:repo`
 * should type the result as `RepoLike` rather than `Repo` so the overlay
 * path stays honest.
 *
 * Tracks just the methods that `automerge-repo-solid-primitives`
 * (`useDocHandle`, `useDocument`, etc.) reaches for: `find`, `create`,
 * and the synchronous `handles` index.
 */
export type RepoLike = {
  find<T>(id: AnyDocumentId): Promise<DocHandle<T>>;
  create<T>(initialValue?: T): DocHandle<T>;
  readonly handles: Record<DocumentId, DocHandle<unknown>>;
};

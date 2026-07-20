import {
  interpretAsDocumentId,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AnyDocumentId,
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  type DocumentProgress,
  type QueryState,
  type Repo,
} from "@automerge/automerge-repo";

import { request } from "./index.js";
import { forwardingProxy } from "./forwarding-proxy.js";
import { OverlayHandle } from "./overlay-handle.js";
import type { RepoLike } from "./types.js";

/**
 * Cloneable answer to a `repo:handle-descriptor` subscription.
 *
 * - `url` is the *presented* identity the consumer asked for; the resolved
 *   handle reports this url back even when it is backed by a clone.
 * - `cloneUrl`, when present, names the document the handle should actually
 *   read from and write to.
 *
 * Fork invariant: `cloneUrl` MUST be a fork of `url` (it shares `url`'s
 * history). Positional refs and cursors are resolved against the presented
 * url, so a `cloneUrl` that is not a fork would silently break ref/cursor
 * identity. Remappers are responsible for upholding this.
 *
 * The descriptor crosses the `patchwork:subscribe` channel structured-cloned,
 * which is why it carries plain `AutomergeUrl` strings and never a live
 * `DocHandle`/`Repo`.
 */
export type DocHandleDescriptor = {
  url: AutomergeUrl;
  cloneUrl?: AutomergeUrl;
};

// The only members whose behavior an overlay repo changes; everything else
// (create/create2/clone/delete, the EventEmitter surface, ...) forwards to the
// realm-local base repo.
const OVERLAY_REPO_OWNED: ReadonlySet<PropertyKey> = new Set<PropertyKey>([
  "baseRepo",
  "handles",
  "find",
  "findWithProgress",
  "create",
  "create2",
  "dispose",
]);

/**
 * A realm-local {@link RepoLike} shim that makes document resolution
 * remappable across provider scopes (including iframes) without sending a live
 * `Repo`/`DocHandle` over the wire.
 *
 * `find`/`findWithProgress` dispatch a `repo:handle-descriptor` subscription for
 * the requested url and resolve the returned `cloneUrl ?? url` against the
 * realm-local `baseRepo`, then hand back an {@link OverlayHandle} that keeps
 * reporting the *original* url. Every other method (`create`, `create2`,
 * `clone`, `delete`, the EventEmitter surface, ...) forwards to `baseRepo`
 * unchanged — created docs need no remapping.
 */
export class OverlayRepo implements RepoLike {
  readonly baseRepo: Repo;
  readonly #element: HTMLElement;
  // Keyed by the *presented* url (documentId + path + heads), not just the
  // documentId, so distinct sub-document paths under the same root document
  // don't collide.
  readonly #wrapped = new Map<AutomergeUrl, OverlayHandle<unknown>>();
  readonly #inner = new Map<AutomergeUrl, DocumentProgress<unknown>>();
  readonly #resolving = new Map<
    AutomergeUrl,
    Promise<OverlayHandle<unknown>>
  >();
  #disposed = false;

  constructor(baseRepo: Repo, element: HTMLElement) {
    this.baseRepo = baseRepo;
    this.#element = element;
    return forwardingProxy<OverlayRepo>(this, baseRepo, OVERLAY_REPO_OWNED);
  }

  // Only already-wrapped handles are exposed; unknown ids fall through to
  // `find`/`findWithProgress` so consumers never see an un-wrapped handle.
  // `#wrapped` is keyed by presented url, so derive the documentId from each
  // handle; sub-handles of the same root collapse onto a single entry (the
  // `Record<DocumentId, ...>` shape can't represent paths).
  get handles(): Record<DocumentId, DocHandle<unknown>> {
    const out = {} as Record<DocumentId, DocHandle<unknown>>;
    for (const wrapped of this.#wrapped.values()) {
      out[wrapped.documentId] = wrapped as unknown as DocHandle<unknown>;
    }
    return out;
  }

  async find<T>(id: AnyDocumentId): Promise<DocHandle<T>> {
    const presented = presentedUrlOf(id);
    const cached = this.#wrapped.get(presented);
    if (cached) return cached as unknown as DocHandle<T>;
    const wrapped = await this.#resolve<T>(presented);
    return wrapped as unknown as DocHandle<T>;
  }

  // Mirrors the realm-local repo's progress but reports `loading` until the
  // descriptor has arrived and the backing handle is wrapped — otherwise
  // consumers would briefly observe the un-wrapped (un-remapped) handle.
  findWithProgress<T>(id: AnyDocumentId): DocumentProgress<T> {
    const self = this;
    const presented = presentedUrlOf(id);
    // The reported `documentId` is the root id — `DocumentId` can't encode a
    // path — but caches are keyed by the full presented url.
    const documentId = parseAutomergeUrl(presented).documentId;
    const wrappedPromise = this.#resolve<T>(presented);
    wrappedPromise.catch(() => {});

    const peek = (): QueryState<T> => {
      const inner = self.#inner.get(presented) as
        | DocumentProgress<T>
        | undefined;
      if (!inner) return { state: "loading", sources: {} };
      const innerState = inner.peek();
      if (innerState.state !== "ready") return innerState;
      const wrapped = self.#wrapped.get(presented);
      if (!wrapped) {
        return { state: "loading", sources: innerState.sources };
      }
      return {
        state: "ready",
        handle: wrapped as unknown as DocHandle<T>,
        sources: innerState.sources,
      };
    };

    return {
      documentId,
      peek,
      subscribe: (callback) => {
        // `closed` covers the unsubscribe-before-resolve race: without it the
        // resolution settling later would still subscribe to the inner
        // progress (leaking that subscription forever) and invoke the
        // consumer's callback after it unsubscribed.
        let closed = false;
        let last: string | null = null;
        let unsubscribeInner: () => void = () => {};
        const dispatch = () => {
          if (closed) return;
          const state = peek();
          const sig =
            state.state === "failed"
              ? `failed:${state.error.message}`
              : state.state;
          if (sig === last) return;
          last = sig;
          callback(state);
        };
        wrappedPromise.then(() => {
          if (closed) return;
          const inner = self.#inner.get(presented);
          if (inner) unsubscribeInner = inner.subscribe(dispatch);
          dispatch();
        }, dispatch);
        return () => {
          closed = true;
          unsubscribeInner();
        };
      },
      whenReady: ({ signal } = {}) => {
        const handlePromise = wrappedPromise as unknown as Promise<
          DocHandle<T>
        >;
        if (signal?.aborted) return Promise.reject(signal.reason);
        if (!signal) return handlePromise;
        return new Promise<DocHandle<T>>((resolve, reject) => {
          const onAbort = () => reject(signal.reason);
          signal.addEventListener("abort", onAbort, { once: true });
          handlePromise.then(
            (handle) => {
              signal.removeEventListener("abort", onAbort);
              resolve(handle);
            },
            (err) => {
              signal.removeEventListener("abort", onAbort);
              reject(err);
            }
          );
        });
      },
      // Deprecated; kept for pre-`peek()` consumers.
      get state() {
        return peek().state;
      },
      get progress() {
        return self.#inner.get(presented)?.progress;
      },
      get error() {
        const s = peek();
        return s.state === "failed" ? s.error : undefined;
      },
    };
  }

  // Plain local creates need no remapping; declared (rather than forwarded) so
  // the class still satisfies `RepoLike`.
  create<T>(initialValue?: T): DocHandle<T> {
    return this.baseRepo.create<T>(initialValue);
  }

  create2<T>(initialValue?: T): Promise<DocHandle<T>> {
    return this.baseRepo.create2<T>(initialValue);
  }

  dispose(): void {
    this.#disposed = true;
    for (const wrapped of this.#wrapped.values()) wrapped.dispose();
    this.#wrapped.clear();
    this.#inner.clear();
    this.#resolving.clear();
  }

  // De-dupes concurrent resolutions of the same presented url: the first
  // caller dispatches the subscription, everyone else awaits the same promise.
  #resolve<T>(presented: AutomergeUrl): Promise<OverlayHandle<T>> {
    const existing = this.#resolving.get(presented);
    if (existing) return existing as Promise<OverlayHandle<T>>;

    const promise = (async () => {
      // The descriptor channel remaps whole documents, so ask about the root
      // and reapply the original path/heads onto whatever clone comes back.
      // The clone is a fork of the root, so the same sub-tree exists in it.
      const { documentId, segments, heads } = parseAutomergeUrl(presented);
      const rootUrl = stringifyAutomergeUrl({ documentId });
      const descriptor = await request<DocHandleDescriptor>(this.#element, {
        type: "repo:handle-descriptor",
        url: rootUrl,
      });
      const backingRoot = descriptor.cloneUrl ?? descriptor.url;
      const backingUrl = stringifyAutomergeUrl({
        documentId: parseAutomergeUrl(backingRoot).documentId,
        segments,
        heads,
      });
      const inner = this.baseRepo.findWithProgress<T>(backingUrl);
      this.#inner.set(presented, inner as DocumentProgress<unknown>);
      const backing = await this.baseRepo.find<T>(backingUrl);
      const wrapped = new OverlayHandle<T>({
        presentedUrl: presented,
        backing,
      });
      if (this.#disposed) {
        wrapped.dispose();
        return wrapped;
      }
      this.#wrapped.set(presented, wrapped as OverlayHandle<unknown>);
      return wrapped;
    })();

    // Only successful resolutions stay memoized. A rejection — typically
    // baseRepo.find reporting unavailable because the doc (or its keyhive
    // access) hasn't synced yet — is retryable, so caching it would pin every
    // future find() of this url to the same stale rejection and defeat the
    // views' "retry once access syncs" recovery. Evict so the next find()
    // re-runs the whole resolution. The identity check keeps a late-arriving
    // cleanup from clobbering a newer in-flight attempt.
    promise.catch(() => {
      if (this.#resolving.get(presented) === promise) {
        this.#resolving.delete(presented);
        this.#inner.delete(presented);
      }
    });

    this.#resolving.set(presented, promise as Promise<OverlayHandle<unknown>>);
    return promise;
  }
}

// Canonicalize any id to its *presented* url, preserving the path suffix
// (`/a/@0/b`) and any pinned heads so sub-document and view-scoped urls keep
// their identity through the overlay. Plain document ids carry no path.
function presentedUrlOf(id: AnyDocumentId): AutomergeUrl {
  if (isValidAutomergeUrl(id)) {
    const { documentId, segments, heads } = parseAutomergeUrl(id);
    return stringifyAutomergeUrl({ documentId, segments, heads });
  }
  return stringifyAutomergeUrl({ documentId: interpretAsDocumentId(id) });
}

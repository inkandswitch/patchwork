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
import type { RepoLike } from "./types.js";

/**
 * Cloneable answer to a `patchwork:dochandle` subscription.
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

/**
 * Wrap `overrides` in a Proxy that serves the listed `owned` properties from
 * `overrides` itself and transparently forwards every other access to
 * `backing`.
 *
 * Both sides are read with the matching receiver and functions are bound to
 * their owner: owned members run against `overrides` (so its private `#fields`
 * keep working) and forwarded members run against `backing` (so the borrowed
 * method gets the right `this`). This lets the overlay classes spell out only
 * the handful of members whose behavior differs and inherit the rest of the
 * large, evolving `Repo` / `DocHandle` surface for free.
 */
function forwardingProxy<T>(
  overrides: object,
  backing: object,
  owned: ReadonlySet<PropertyKey>
): T {
  return new Proxy(overrides, {
    get(target, prop) {
      const source = owned.has(prop) ? target : backing;
      const value = Reflect.get(source, prop, source);
      return typeof value === "function" ? value.bind(source) : value;
    },
    has(target, prop) {
      return owned.has(prop) || prop in backing || prop in target;
    },
  }) as T;
}

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
]);

/**
 * A realm-local {@link RepoLike} shim that makes document resolution
 * remappable across provider scopes (including iframes) without sending a live
 * `Repo`/`DocHandle` over the wire.
 *
 * `find`/`findWithProgress` dispatch a `patchwork:dochandle` subscription for
 * the requested url and resolve the returned `cloneUrl ?? url` against the
 * realm-local `baseRepo`, then hand back an {@link OverlayHandle} that keeps
 * reporting the *original* url. Every other method (`create`, `create2`,
 * `clone`, `delete`, the EventEmitter surface, ...) forwards to `baseRepo`
 * unchanged — created docs need no remapping.
 */
export class OverlayRepo implements RepoLike {
  /** The realm-local repo all resolution ultimately bottoms out in. */
  readonly baseRepo: Repo;
  readonly #element: HTMLElement;
  // Keyed by the *presented* url (documentId + path + heads), not just the
  // documentId, so distinct sub-document paths under the same root document
  // don't collide.
  readonly #wrapped = new Map<AutomergeUrl, OverlayHandle<unknown>>();
  readonly #inner = new Map<AutomergeUrl, DocumentProgress<unknown>>();
  readonly #resolving = new Map<AutomergeUrl, Promise<OverlayHandle<unknown>>>();

  constructor(baseRepo: Repo, element: HTMLElement) {
    this.baseRepo = baseRepo;
    this.#element = element;
    // Forward everything but resolution to the realm-local repo.
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
        let last: string | null = null;
        let unsubscribeInner: () => void = () => {};
        const dispatch = () => {
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
          const inner = self.#inner.get(presented);
          if (inner) unsubscribeInner = inner.subscribe(dispatch);
          dispatch();
        }, dispatch);
        return () => unsubscribeInner();
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
        type: "patchwork:dochandle",
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
      this.#wrapped.set(presented, wrapped as OverlayHandle<unknown>);
      return wrapped;
    })();

    this.#resolving.set(presented, promise as Promise<OverlayHandle<unknown>>);
    return promise;
  }
}

type Listener = (...args: unknown[]) => void;

// The only members whose behavior an overlay handle changes: the presented
// identity, the argument-unwrapping handle comparisons (`merge`/`overlaps`/
// `contains`/`isChildOf`/`equals`), and the re-stamping EventEmitter surface.
// Everything else (doc/change/heads/ref/view/diff/...) forwards to the backing
// handle.
const OVERLAY_HANDLE_OWNED: ReadonlySet<PropertyKey> = new Set<PropertyKey>([
  "url",
  "documentId",
  "backingHandle",
  "merge",
  "overlaps",
  "contains",
  "isChildOf",
  "equals",
  "on",
  "off",
  "once",
  "addListener",
  "removeListener",
  "removeAllListeners",
  "emit",
]);

export type OverlayHandleOpts<T> = {
  /** The url the handle reports to consumers (hides the backing/clone url). */
  presentedUrl: AutomergeUrl;
  /** The live handle every operation is forwarded to. */
  backing: DocHandle<T>;
};

/**
 * A url-hiding proxy around a fixed backing `DocHandle`. `url`/`documentId`
 * always report the *presented* url; every other operation forwards to the
 * backing handle. Event subscriptions are tracked locally and the backing
 * handle's events are lazily forwarded with `payload.handle` re-stamped to this
 * wrapper, so consumers never observe the backing (clone) handle or its url.
 *
 * Unlike the copy-on-write handle it is modelled on, the backing never swaps:
 * remappers clone eagerly and hand back the clone up front, so there is no
 * COW, no re-wiring, and no synthetic change nudge.
 */
export class OverlayHandle<T> {
  readonly #originalUrl: AutomergeUrl;
  readonly #handle: DocHandle<T>;
  readonly #listeners = new Map<string, Set<Listener>>();
  readonly #forwarded = new Set<string>();
  // The Proxy returned from the constructor — the object consumers actually
  // hold. Re-stamped onto forwarded events so identity stays consistent.
  #self: OverlayHandle<T>;

  constructor(opts: OverlayHandleOpts<T>) {
    this.#originalUrl = opts.presentedUrl;
    this.#handle = opts.backing;
    this.#self = forwardingProxy<OverlayHandle<T>>(
      this,
      opts.backing,
      OVERLAY_HANDLE_OWNED
    );
    return this.#self;
  }

  get url(): AutomergeUrl {
    return this.#originalUrl;
  }

  get documentId(): DocumentId {
    return parseAutomergeUrl(this.#originalUrl).documentId;
  }

  /** @internal The live handle this wrapper forwards to. */
  get backingHandle(): DocHandle<T> {
    return this.#handle;
  }

  // Handle comparisons read the *other* handle's internals (Automerge rejects
  // a foreign wrapper, and `overlaps`/`contains` touch its private `#path`), so
  // unwrap an overlay argument down to its backing before delegating.
  merge(other: DocHandle<T>): void {
    this.#handle.merge(unwrapHandle(other));
  }

  overlaps(other: DocHandle<unknown>): boolean {
    return this.#handle.overlaps(unwrapHandle(other));
  }

  contains(other: DocHandle<unknown>): boolean {
    return this.#handle.contains(unwrapHandle(other));
  }

  isChildOf(other: DocHandle<unknown>): boolean {
    return this.#handle.isChildOf(unwrapHandle(other));
  }

  equals(other: DocHandle<unknown>): boolean {
    return this.#handle.equals(unwrapHandle(other));
  }

  on(ev: string, fn: Listener): OverlayHandle<T> {
    this.#forward(ev);
    let set = this.#listeners.get(ev);
    if (!set) {
      set = new Set();
      this.#listeners.set(ev, set);
    }
    set.add(fn);
    return this.#self;
  }

  off(ev: string, fn: Listener): OverlayHandle<T> {
    this.#listeners.get(ev)?.delete(fn);
    return this.#self;
  }

  once(ev: string, fn: Listener): OverlayHandle<T> {
    const wrapper: Listener = (...args) => {
      this.off(ev, wrapper);
      fn(...args);
    };
    return this.on(ev, wrapper);
  }

  addListener(ev: string, fn: Listener): OverlayHandle<T> {
    return this.on(ev, fn);
  }

  removeListener(ev: string, fn: Listener): OverlayHandle<T> {
    return this.off(ev, fn);
  }

  removeAllListeners(ev?: string): OverlayHandle<T> {
    if (ev) this.#listeners.get(ev)?.clear();
    else this.#listeners.clear();
    return this.#self;
  }

  emit(ev: string, ...args: unknown[]): boolean {
    const set = this.#listeners.get(ev);
    if (!set || set.size === 0) return false;
    for (const fn of [...set]) fn(...args);
    return true;
  }

  // Lazily forward a backing event the first time someone subscribes to it,
  // re-stamping `payload.handle = this wrapper` so consumers see the wrapper
  // rather than the backing handle as the event source.
  #forward(ev: string): void {
    if (this.#forwarded.has(ev)) return;
    this.#forwarded.add(ev);
    (this.#handle as unknown as { on(ev: string, fn: Listener): void }).on(
      ev,
      (payload: unknown) => {
        if (
          payload &&
          typeof payload === "object" &&
          "handle" in (payload as Record<string, unknown>)
        ) {
          this.emit(ev, { ...(payload as object), handle: this.#self });
        } else {
          this.emit(ev, payload);
        }
      }
    );
  }
}

// Unwrap an overlay wrapper down to its backing handle (Automerge rejects a
// foreign wrapper, and comparisons touch the backing's private fields). Plain
// handles pass through untouched.
function unwrapHandle<T>(handle: DocHandle<T>): DocHandle<T> {
  return handle instanceof OverlayHandle
    ? (handle.backingHandle as DocHandle<T>)
    : handle;
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

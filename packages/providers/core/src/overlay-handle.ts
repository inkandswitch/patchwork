import {
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
} from "@automerge/automerge-repo";

import { forwardingProxy } from "./forwarding-proxy.js";

type Listener = (...args: unknown[]) => void;

// The only members whose behavior an overlay handle changes: the presented
// identity, the identity-preserving `sub` (so sub-handle urls stay in the
// presented space), the argument-unwrapping handle comparisons
// (`merge`/`overlaps`/`contains`/`isChildOf`/`equals`), and the re-stamping
// EventEmitter surface. Everything else (doc/change/heads/ref/view/diff/...)
// forwards to the backing handle.
const OVERLAY_HANDLE_OWNED: ReadonlySet<PropertyKey> = new Set<PropertyKey>([
  "url",
  "documentId",
  "backingHandle",
  "sub",
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
  // Sub-handle wrappers keyed by their backing (canonicalised) url, so repeated
  // `sub(...)` of the same path return the same wrapper instance.
  readonly #subCache = new Map<AutomergeUrl, OverlayHandle<unknown>>();
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

  // Sub-handles must keep reporting urls in the *presented* space; otherwise a
  // ref or cursor produced here (a comment target, a selection cursor, ...)
  // would leak the backing (clone) documentId and break identity for consumers
  // that resolve it back through the overlay. We scope `sub` to the backing
  // handle (reads/writes still hit the clone) but wrap the result in another
  // OverlayHandle whose presented url swaps the documentId back to ours. The
  // backing sub-handle is canonicalised by the repo, so caching by its url
  // keeps our wrappers referentially stable too.
  sub(...segments: unknown[]): DocHandle<unknown> {
    const backingSub = (
      this.#handle as unknown as {
        sub: (...s: unknown[]) => DocHandle<unknown>;
      }
    ).sub(...segments);
    const cached = this.#subCache.get(backingSub.url);
    if (cached) return cached as unknown as DocHandle<unknown>;
    const wrapped = new OverlayHandle<unknown>({
      presentedUrl: restampUrl(this.#originalUrl, backingSub.url),
      backing: backingSub,
    });
    this.#subCache.set(backingSub.url, wrapped);
    return wrapped as unknown as DocHandle<unknown>;
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

// Re-stamp a backing (clone) handle url into the presented space: keep the
// path segments and any pinned heads, but swap the documentId back to the
// presented root's. Mirrors the original->clone mapping in OverlayRepo#resolve.
function restampUrl(
  presentedRoot: AutomergeUrl,
  backingUrl: AutomergeUrl
): AutomergeUrl {
  const { documentId } = parseAutomergeUrl(presentedRoot);
  const { segments, heads } = parseAutomergeUrl(backingUrl);
  return stringifyAutomergeUrl({ documentId, segments, heads });
}

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
// identity, the backing accessors (`backingHandle`/`swapBacking`), the
// identity-preserving `sub` (so sub-handle urls stay in the presented space),
// the argument-unwrapping handle comparisons
// (`merge`/`overlaps`/`contains`/`isChildOf`/`equals`), and the re-stamping
// EventEmitter surface. Everything else (doc/change/heads/ref/view/diff/...)
// forwards to the backing handle.
const OVERLAY_HANDLE_OWNED: ReadonlySet<PropertyKey> = new Set<PropertyKey>([
  "url",
  "documentId",
  "backingHandle",
  "swapBacking",
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

type SubCacheEntry = {
  wrapped: OverlayHandle<unknown>;
  /** The original `sub(...)` arguments, replayed against a new backing. */
  segments: unknown[];
};

/**
 * A url-hiding proxy around a swappable backing `DocHandle`. `url`/`documentId`
 * always report the *presented* url; every other operation forwards to the
 * current backing handle. Event subscriptions are tracked locally and the
 * backing handle's events are lazily forwarded with `payload.handle`
 * re-stamped to this wrapper, so consumers never observe the backing (clone)
 * handle or its url.
 *
 * Remappers may re-point a live handle at a different backing via
 * {@link swapBacking} (e.g. the draft overlay switching between per-draft
 * clones): forwarded listeners are re-wired onto the new backing, cached
 * sub-handles are recursively re-based, and a synthetic `change` event with
 * `scopeReplaced: true` tells consumers to re-read `doc()` rather than apply
 * patches — the two backings may be divergent forks, so no incremental patch
 * stream connects them.
 */
export class OverlayHandle<T> {
  readonly #originalUrl: AutomergeUrl;
  #handle: DocHandle<T>;
  readonly #listeners = new Map<string, Set<Listener>>();
  // Forwarder closures attached to the current backing, kept so a swap can
  // move them onto the next backing.
  readonly #forwarders = new Map<string, Listener>();
  // Sub-handle wrappers keyed by their *presented* url (stable across backing
  // swaps), so repeated `sub(...)` of the same path return the same wrapper.
  readonly #subCache = new Map<AutomergeUrl, SubCacheEntry>();
  // The Proxy returned from the constructor — the object consumers actually
  // hold. Re-stamped onto forwarded events so identity stays consistent.
  #self: OverlayHandle<T>;

  constructor(opts: OverlayHandleOpts<T>) {
    this.#originalUrl = opts.presentedUrl;
    this.#handle = opts.backing;
    this.#self = forwardingProxy<OverlayHandle<T>>(
      this,
      () => this.#handle,
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

  /** @internal The live handle this wrapper currently forwards to. */
  get backingHandle(): DocHandle<T> {
    return this.#handle;
  }

  /**
   * @internal Re-point this wrapper (and its cached sub-handles) at a new
   * backing handle, keeping the presented identity and the wrapper's proxy
   * identity intact. Emits a synthetic `change` with `scopeReplaced: true` so
   * consumers reconcile from `doc()` instead of applying patches (the old and
   * new backings may be divergent forks).
   */
  swapBacking(next: DocHandle<T>): void {
    const previous = this.#handle;
    if (next === previous) return;
    const before = previous.doc();
    this.#handle = next;

    // Move the lazily-attached forwarders onto the new backing so consumer
    // listeners keep firing.
    const emitter = (handle: DocHandle<T>) =>
      handle as unknown as {
        on(ev: string, fn: Listener): void;
        off(ev: string, fn: Listener): void;
      };
    for (const [ev, forwarder] of this.#forwarders) {
      emitter(previous).off(ev, forwarder);
      emitter(next).on(ev, forwarder);
    }

    // Re-base cached sub-handles by replaying their original segments against
    // the new backing; each re-based child emits its own scopeReplaced change.
    for (const entry of this.#subCache.values()) {
      const nextSub = (
        next as unknown as { sub: (...s: unknown[]) => DocHandle<unknown> }
      ).sub(...entry.segments);
      entry.wrapped.swapBacking(nextSub);
    }

    // The synthetic nudge: there is no patch stream from the old backing to
    // the new one, so signal a wholesale scope replacement. Fine-grained
    // consumers (e.g. solid-primitives' makeDocumentProjection) reconcile
    // from `doc` when `scopeReplaced` is set.
    const after = next.doc();
    this.emit("change", {
      handle: this.#self,
      doc: after,
      patches: [],
      scopeReplaced: true,
      patchInfo: { before, after, source: "change" },
    });
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
  // OverlayHandle whose presented url swaps the documentId back to ours.
  // Caching by the presented url (stable across backing swaps) keeps our
  // wrappers referentially stable; the original segments are kept so a swap
  // can replay them against the new backing.
  sub(...segments: unknown[]): DocHandle<unknown> {
    const backingSub = (
      this.#handle as unknown as {
        sub: (...s: unknown[]) => DocHandle<unknown>;
      }
    ).sub(...segments);
    const presentedSubUrl = restampUrl(this.#originalUrl, backingSub.url);
    const cached = this.#subCache.get(presentedSubUrl);
    if (cached) return cached.wrapped as unknown as DocHandle<unknown>;
    const wrapped = new OverlayHandle<unknown>({
      presentedUrl: presentedSubUrl,
      backing: backingSub,
    });
    this.#subCache.set(presentedSubUrl, { wrapped, segments });
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

  // Listener errors are isolated (logged, not rethrown) so one consumer that
  // can't handle an event — e.g. an incremental differ seeing a scopeReplaced
  // swap across divergent forks — doesn't starve the listeners behind it.
  //
  // Listeners unsubscribed *during* the emit are skipped (unlike Node's
  // EventEmitter, which runs the whole snapshot): a scopeReplaced consumer may
  // rebuild machinery that unsubscribes a listener later in the snapshot —
  // e.g. codemirror's swap handler replaces the sync plugin — and invoking
  // the torn-down listener would re-apply state it already handed off (the
  // old sync plugin would re-insert the fork's changes on top of the reset
  // editor content, duplicating text).
  emit(ev: string, ...args: unknown[]): boolean {
    const set = this.#listeners.get(ev);
    if (!set || set.size === 0) return false;
    for (const fn of [...set]) {
      if (!set.has(fn)) continue;
      try {
        fn(...args);
      } catch (err) {
        console.error(
          `[patchwork-providers] "${ev}" listener on ${this.#originalUrl} threw:`,
          err
        );
      }
    }
    return true;
  }

  // Lazily forward a backing event the first time someone subscribes to it,
  // re-stamping `payload.handle = this wrapper` so consumers see the wrapper
  // rather than the backing handle as the event source. The forwarder is kept
  // in `#forwarders` so `swapBacking` can move it to a new backing.
  #forward(ev: string): void {
    if (this.#forwarders.has(ev)) return;
    const forwarder: Listener = (payload: unknown) => {
      if (
        payload &&
        typeof payload === "object" &&
        "handle" in (payload as Record<string, unknown>)
      ) {
        this.emit(ev, { ...(payload as object), handle: this.#self });
      } else {
        this.emit(ev, payload);
      }
    };
    this.#forwarders.set(ev, forwarder);
    (this.#handle as unknown as { on(ev: string, fn: Listener): void }).on(
      ev,
      forwarder
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

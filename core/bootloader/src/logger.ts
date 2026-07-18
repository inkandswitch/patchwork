/**
 * A small, persistent, contention-avoidant ring logger shared by every
 * Patchwork execution context (the tab, the automerge SharedWorker, and the
 * service worker).
 *
 * Design goals, in priority order:
 *
 *  1. **Never contend with the `automerge` IndexedDB store.** Each context
 *     writes to its *own dedicated database* (`patchwork-logs-<context>`), so
 *     log writes never acquire transaction locks on the hot document store
 *     subduction reads/writes. (IndexedDB transaction locks are scoped per
 *     database.) The only remaining shared resource is raw disk/CPU I/O, which
 *     we keep negligible via batching + deferral below.
 *
 *  2. **Batched, deferred flush.** Entries accumulate in memory and are written
 *     in a single transaction per flush — never one transaction per line.
 *     Flushing does not begin until {@link RingLogger.start} is called (after
 *     the boot/hydration window, the most contention-sensitive phase), with a
 *     failsafe auto-start so a wedged boot still eventually persists.
 *
 *  3. **Always-on capture.** Recording is independent of the `debug` enable
 *     flag — failures are unpredictable, so we always keep history.
 *
 *  4. **Tiered retention.** A general `entries` store keeps the last
 *     {@link PERSIST_MAX_ENTRIES} of everything; a separate `errors` store
 *     keeps the last {@link PERSIST_MAX_ERRORS} of `warn`/`error` only, so an
 *     error from hours ago survives a burst of recent debug spam.
 *
 * The logger is deliberately self-contained and worker-safe: it touches only
 * `indexedDB`, `crypto`, timers and `globalThis` — never the DOM.
 */

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export interface LogEntry {
  /** Per-session id, so entries from different sessions never collide. */
  session: string;
  /** Monotonic counter within the session. */
  n: number;
  /** Wall-clock timestamp (`Date.now()`), for cross-context merge. */
  ts: number;
  level: string;
  context: string;
  /** Already-serialized argument strings. */
  args: string[];
}

const ERROR_LEVELS = new Set(["warn", "error"]);

// In-memory caps (per context). Recent entries kept for export coverage of the
// just-happened window even before/without a successful flush.
const MAX_BUFFER = 5_000;
// Persisted caps (per context, per store). "Fairly large" per design.
const PERSIST_MAX_ENTRIES = 15_000;
const PERSIST_MAX_ERRORS = 15_000;

const FLUSH_INTERVAL_MS = 2_000;
const FLUSH_THRESHOLD = 64;
// Failsafe: persist even if start() is never called (e.g. a wedged boot), so a
// later reload's diagnostics export still sees the history leading up to it.
const AUTOSTART_MS = 15_000;

const MAX_ARG_CHARS = 8_192;
const DB_VERSION = 1;
const ENTRIES_STORE = "entries";
const ERRORS_STORE = "errors";

function serializeArg(arg: unknown): string {
  let out: string;
  if (typeof arg === "string") out = arg;
  else if (arg instanceof Error)
    out = arg.stack || `${arg.name}: ${arg.message}`;
  else {
    try {
      out = JSON.stringify(arg) ?? String(arg);
    } catch {
      out = String(arg);
    }
  }
  return out.length > MAX_ARG_CHARS
    ? out.slice(0, MAX_ARG_CHARS) + `…[+${out.length - MAX_ARG_CHARS} chars]`
    : out;
}

function newSession(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class RingLogger {
  readonly context: string;
  readonly #session = newSession();
  #n = 0;

  // Recent entries (flushed or not), capped — used for export coverage.
  #buffer: LogEntry[] = [];
  // Entries awaiting persistence, capped — disjoint-ish from persisted store.
  #pending: LogEntry[] = [];
  #dropped = 0;

  #db: IDBDatabase | null = null;
  #dbPromise: Promise<IDBDatabase | null> | null = null;
  #started = false;
  #flushTimer: ReturnType<typeof setInterval> | null = null;
  #flushing: Promise<void> | null = null;
  #autostart: ReturnType<typeof setTimeout> | null = null;

  constructor(context: string) {
    this.context = context;
    this.#dbName = `patchwork-logs-${context}`;
    // Begin opening the DB eagerly (but lazily flush). Failure is non-fatal:
    // the logger degrades to in-memory only.
    void this.#openDb();
    try {
      this.#autostart = setTimeout(() => this.start(), AUTOSTART_MS);
    } catch {
      // timers unavailable — fine
    }
  }

  readonly #dbName: string;

  /** Record a log line. Cheap and synchronous; never throws. */
  record(level: string, args: unknown[]): void {
    try {
      const entry: LogEntry = {
        session: this.#session,
        n: ++this.#n,
        ts: Date.now(),
        level,
        context: this.context,
        args: args.map(serializeArg),
      };
      this.#push(this.#buffer, entry);
      this.#push(this.#pending, entry);
      if (this.#started && this.#pending.length >= FLUSH_THRESHOLD) {
        void this.flush();
      }
    } catch {
      // Logging must never break the app.
    }
  }

  #push(list: LogEntry[], entry: LogEntry): void {
    list.push(entry);
    if (list.length > MAX_BUFFER) {
      list.shift();
      if (list === this.#pending) this.#dropped++;
    }
  }

  /** Begin periodic + threshold flushing. Idempotent. */
  start(): void {
    if (this.#started) return;
    this.#started = true;
    if (this.#autostart) {
      clearTimeout(this.#autostart);
      this.#autostart = null;
    }
    try {
      this.#flushTimer = setInterval(
        () => void this.flush(),
        FLUSH_INTERVAL_MS
      );
    } catch {
      // timers unavailable
    }
    void this.flush();
  }

  #openDb(): Promise<IDBDatabase | null> {
    if (this.#dbPromise) return this.#dbPromise;
    this.#dbPromise = (async () => {
      try {
        if (typeof indexedDB === "undefined") return null;
        const req = indexedDB.open(this.#dbName, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
            db.createObjectStore(ENTRIES_STORE, { autoIncrement: true });
          }
          if (!db.objectStoreNames.contains(ERRORS_STORE)) {
            db.createObjectStore(ERRORS_STORE, { autoIncrement: true });
          }
        };
        const db = await promisify(req);
        this.#db = db;
        return db;
      } catch {
        return null;
      }
    })();
    return this.#dbPromise;
  }

  /** Persist any pending entries in a single transaction. Never throws. */
  async flush(): Promise<void> {
    if (this.#flushing) return this.#flushing;
    if (!this.#pending.length) return;
    this.#flushing = (async () => {
      const db = await this.#openDb();
      if (!db) return;
      const batch = this.#pending.splice(0);
      try {
        await this.#writeBatch(db, batch);
      } catch {
        // Re-queue (bounded) so a transient failure doesn't lose everything.
        this.#pending.unshift(...batch.slice(-MAX_BUFFER));
      }
    })().finally(() => {
      this.#flushing = null;
    });
    return this.#flushing;
  }

  #writeBatch(db: IDBDatabase, batch: LogEntry[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([ENTRIES_STORE, ERRORS_STORE], "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      const entries = tx.objectStore(ENTRIES_STORE);
      const errors = tx.objectStore(ERRORS_STORE);
      for (const entry of batch) {
        entries.add(entry);
        if (ERROR_LEVELS.has(entry.level)) errors.add(entry);
      }
      void this.#trim(entries, PERSIST_MAX_ENTRIES);
      void this.#trim(errors, PERSIST_MAX_ERRORS);
    });
  }

  #trim(store: IDBObjectStore, max: number): void {
    const countReq = store.count();
    countReq.onsuccess = () => {
      let excess = countReq.result - max;
      if (excess <= 0) return;
      // autoIncrement keys ascend, so the default cursor yields oldest first.
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor || excess <= 0) return;
        cursor.delete();
        excess--;
        cursor.continue();
      };
    };
  }

  /**
   * Merge persisted history (both stores) with the in-memory buffer, deduped
   * by `session:n` and sorted by timestamp. Used by the diagnostics export.
   */
  async readForExport(): Promise<{ entries: LogEntry[]; dropped: number }> {
    const merged = new Map<string, LogEntry>();
    const add = (e: LogEntry) => {
      if (e && typeof e.n === "number") merged.set(`${e.session}:${e.n}`, e);
    };
    try {
      const db = await this.#openDb();
      if (db) {
        for (const store of [ENTRIES_STORE, ERRORS_STORE]) {
          const tx = db.transaction(store, "readonly");
          const all = await promisify(tx.objectStore(store).getAll());
          (all as LogEntry[]).forEach(add);
        }
      }
    } catch {
      // fall back to in-memory only
    }
    this.#buffer.forEach(add);
    const entries = [...merged.values()].sort(
      (a, b) => a.ts - b.ts || a.n - b.n
    );
    return { entries, dropped: this.#dropped };
  }

  /** In-memory recent entries only (no IDB read). */
  recent(): LogEntry[] {
    return this.#buffer.slice();
  }

  /** Stop all timers. For teardown / tests. */
  dispose(): void {
    if (this.#autostart) {
      clearTimeout(this.#autostart);
      this.#autostart = null;
    }
    if (this.#flushTimer) {
      clearInterval(this.#flushTimer);
      this.#flushTimer = null;
    }
  }
}

/** Render entries as a plain-text log file body. */
export function formatLogEntries(entries: LogEntry[]): string {
  return entries
    .map((e) => {
      const t = new Date(e.ts).toISOString();
      return `${t} [${e.level}] (${e.context}) ${e.args.join(" ")}`;
    })
    .join("\n");
}

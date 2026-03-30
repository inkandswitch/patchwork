/**
 * Persistent ring-buffer logger for service workers.
 *
 * Stores log entries in a dedicated IndexedDB database (`sw-logs`) that is
 * completely separate from the `automerge` database used by the Repo, so
 * writes here never contend with storage or hydration transactions.
 *
 * Entries are accumulated in memory and batch-flushed to IDB periodically
 * (every {@link FLUSH_INTERVAL_MS}) or when the buffer reaches
 * {@link FLUSH_THRESHOLD} entries — whichever comes first.
 *
 * The on-disk store is a ring buffer capped at {@link MAX_ENTRIES}. Oldest
 * entries are pruned on each flush when the cap is exceeded.
 *
 * ## Usage
 *
 * ```ts
 * import { SwLogger } from "./sw-logger.js"
 *
 * const log = await SwLogger.open()
 * log.info("repo initialized")
 * log.warn("connection dropped", { url })
 * log.error("sync threw", error)
 *
 * // From the SW inspector console:
 * self.printLogs()         // prints last 200 entries
 * self.printLogs(5000)     // prints last 5 000 entries
 * self.tailLogs(100)       // returns last 100 entries as an array
 * self.exportLogs()        // returns all entries as JSON string
 * self.clearLogs()         // wipes the log database
 * ```
 */

// ── Configuration ───────────────────────────────────────────────────────

const DB_NAME = "sw-logs";
const DB_VERSION = 1;
const STORE_NAME = "entries";
const MAX_ENTRIES = 50_000;
const FLUSH_INTERVAL_MS = 1_000;
const FLUSH_THRESHOLD = 128;

// ── Types ───────────────────────────────────────────────────────────────

export interface LogEntry {
  /** Auto-incremented IDB key (doubles as ordering index). */
  id?: number;
  /** ISO-8601 timestamp */
  ts: string;
  /** Monotonic high-res timestamp (ms since SW start) */
  hrt: number;
  /** Log level */
  level: "debug" | "info" | "warn" | "error";
  /** Log message */
  msg: string;
  /** Optional structured data (must be cloneable) */
  data?: unknown;
}

// ── Console method lookup ───────────────────────────────────────────────

const consoleMethods: Record<LogEntry["level"], (...args: unknown[]) => void> =
  {
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

// ── Logger interface (shared by real and noop implementations) ──────────

export interface SwLoggerInterface {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
  flush(): Promise<void>;
  tail(n?: number): Promise<LogEntry[]>;
  exportAll(): Promise<string>;
  clear(): Promise<void>;
  dispose(): void;
}

// ── No-op fallback (used when IDB is unavailable) ───────────────────────

class NoopLogger implements SwLoggerInterface {
  debug(msg: string, data?: unknown) {
    consoleMethods.debug(
      `[sw:debug]`,
      msg,
      ...(data !== undefined ? [data] : [])
    );
  }
  info(msg: string, data?: unknown) {
    consoleMethods.info(
      `[sw:info]`,
      msg,
      ...(data !== undefined ? [data] : [])
    );
  }
  warn(msg: string, data?: unknown) {
    consoleMethods.warn(
      `[sw:warn]`,
      msg,
      ...(data !== undefined ? [data] : [])
    );
  }
  error(msg: string, data?: unknown) {
    consoleMethods.error(
      `[sw:error]`,
      msg,
      ...(data !== undefined ? [data] : [])
    );
  }
  async flush() {}
  async tail() {
    return [];
  }
  async exportAll() {
    return "[]";
  }
  async clear() {}
  dispose() {}
}

// ── Implementation ──────────────────────────────────────────────────────

export class SwLogger implements SwLoggerInterface {
  #db: IDBDatabase;
  #buffer: LogEntry[] = [];
  #flushTimer: ReturnType<typeof setInterval> | null = null;

  private constructor(db: IDBDatabase) {
    this.#db = db;
    this.#flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  /**
   * Open (or create) the log database and return a ready logger.
   * If the database cannot be opened (quota, permissions, etc.),
   * returns a {@link NoopLogger} that writes to the console only.
   */
  static async open(): Promise<SwLoggerInterface> {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, {
              keyPath: "id",
              autoIncrement: true,
            });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      return new SwLogger(db);
    } catch (e) {
      console.warn(
        "[sw-logger] failed to open IDB, falling back to console-only:",
        e
      );
      return new NoopLogger();
    }
  }

  // ── Public API ──────────────────────────────────────────────────────

  debug(msg: string, data?: unknown) {
    this.#append("debug", msg, data);
  }

  info(msg: string, data?: unknown) {
    this.#append("info", msg, data);
  }

  warn(msg: string, data?: unknown) {
    this.#append("warn", msg, data);
  }

  error(msg: string, data?: unknown) {
    this.#append("error", msg, data);
  }

  /** Force an immediate flush of the in-memory buffer to IDB. */
  async flush(): Promise<void> {
    if (this.#buffer.length === 0) return;

    const batch = this.#buffer.splice(0);

    try {
      const tx = this.#db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      for (const entry of batch) {
        store.add(entry);
      }

      await txComplete(tx);
    } catch (e) {
      // If the write fails, put the entries back so the next flush retries.
      this.#buffer.unshift(...batch);
      console.warn("[sw-logger] flush failed:", e);
      return;
    }

    try {
      await this.#prune();
    } catch (e) {
      // Prune failures are non-fatal — entries are already committed.
      console.warn("[sw-logger] prune failed:", e);
    }
  }

  /** Read the last `n` entries (default 200). */
  async tail(n = 200): Promise<LogEntry[]> {
    // Flush pending entries first so the tail is up to date.
    await this.flush();

    const tx = this.#db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise<LogEntry[]>((resolve, reject) => {
      const entries: LogEntry[] = [];
      const req = store.openCursor(null, "prev");

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && entries.length < n) {
          entries.push(cursor.value as LogEntry);
          cursor.continue();
        } else {
          resolve(entries.reverse());
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  /** Return all entries as a JSON string (for copy-paste from console). */
  async exportAll(): Promise<string> {
    await this.flush();

    const tx = this.#db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise<string>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(JSON.stringify(req.result, null, 2));
      req.onerror = () => reject(req.error);
    });
  }

  /** Delete all log entries. */
  async clear(): Promise<void> {
    const tx = this.#db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    await txComplete(tx);
  }

  /** Stop the periodic flush timer. */
  dispose() {
    if (this.#flushTimer) {
      clearInterval(this.#flushTimer);
      this.#flushTimer = null;
    }
  }

  // ── Internals ─────────────────────────────────────────────────────

  #append(level: LogEntry["level"], msg: string, data?: unknown) {
    this.#buffer.push({
      ts: new Date().toISOString(),
      hrt: performance.now(),
      level,
      msg,
      data: data !== undefined ? safeClone(data) : undefined,
    });

    // Mirror to console using the appropriate severity method.
    const log = consoleMethods[level];
    const tag = `[sw:${level}]`;
    if (data !== undefined) {
      log(tag, msg, data);
    } else {
      log(tag, msg);
    }

    if (this.#buffer.length >= FLUSH_THRESHOLD) {
      this.flush();
    }
  }

  async #prune() {
    // Count in a separate readonly transaction to avoid
    // TransactionInactiveError from awaiting within a single transaction.
    const count = await new Promise<number>((resolve, reject) => {
      const tx = this.#db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onabort = () =>
        reject(tx.error ?? new Error("sw-logs count transaction aborted"));
    });

    if (count <= MAX_ENTRIES) return;

    // Delete the oldest entries in a separate readwrite transaction.
    const excess = count - MAX_ENTRIES;
    await new Promise<void>((resolve, reject) => {
      const tx = this.#db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      let deleted = 0;
      const req = store.openCursor();

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && deleted < excess) {
          cursor.delete();
          deleted++;
          cursor.continue();
        }
      };

      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(tx.error ?? new Error("sw-logs prune transaction aborted"));
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });
}

// ── Read-only access (usable from any context, including main thread) ───

/**
 * Read-only accessor for the SW log database.
 *
 * Unlike {@link SwLogger}, this class does not hold a persistent IDB
 * connection — each method opens a fresh connection and closes it after
 * use. This avoids interfering with the SW's write transactions.
 *
 * @example
 * ```ts
 * import { SwLogReader } from "@inkandswitch/patchwork-bootloader/sw-logger"
 *
 * const last100 = await SwLogReader.tail(100)
 * const json    = await SwLogReader.exportAll()
 * await SwLogReader.clear()
 * ```
 */
export class SwLogReader {
  /** Read the last `n` entries (default 200), oldest-first. */
  static async tail(n = 200): Promise<LogEntry[]> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      return await new Promise<LogEntry[]>((resolve, reject) => {
        const entries: LogEntry[] = [];
        const req = store.openCursor(null, "prev");

        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor && entries.length < n) {
            entries.push(cursor.value as LogEntry);
            cursor.continue();
          } else {
            resolve(entries.reverse());
          }
        };

        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  }

  /** Return all entries as a JSON string. */
  static async exportAll(): Promise<string> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      return await new Promise<string>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(JSON.stringify(req.result, null, 2));
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  }

  /** Delete all log entries. */
  static async clear(): Promise<void> {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      await txComplete(tx);
    } finally {
      db.close();
    }
  }
}

/** Open a short-lived connection to the log database. */
function openDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Best-effort structured clone for the `data` field. Falls back to string. */
function safeClone(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  try {
    return structuredClone(value);
  } catch {
    return String(value);
  }
}

/**
 * Faithful raw dump of every IndexedDB database for the origin, for the
 * diagnostics bundle.
 *
 * IndexedDB records are arbitrary structured-clone values — for the Automerge
 * storage adapter each record is `{ key: string[], binary: Uint8Array }`, the
 * subduction signer store holds JWK objects, etc. So we can't just concatenate
 * raw bytes. Instead, for each object store we emit two zip entries:
 *
 *  - `<db>.<store>.index.json` — the structure of every record, with each
 *    binary blob replaced by a placeholder `{ "$bin": [offset, length] }`
 *    referencing a slice of the companion `.bin` file.
 *  - `<db>.<store>.bin` — every binary blob concatenated, no base64.
 *
 * To reconstruct a record on the receiving end: parse `index.json`, and wherever
 * you see `{ "$bin": [offset, length] }`, slice `bin.subarray(offset, offset +
 * length)`. Dates are `{ "$date": iso }`, bigints `{ "$bigint": str }`, Maps
 * `{ "$map": [[k,v],…] }`, Sets `{ "$set": [...] }`.
 *
 * This is a deliberately *raw* storage dump (including any orphaned/garbage or
 * subduction-interceptor records) — the right artifact for debugging
 * storage-level problems — not a clean per-document `Automerge.save()` export.
 */

export type Jsonable =
  | null
  | boolean
  | number
  | string
  | Jsonable[]
  | { [key: string]: Jsonable };

export interface StoreIndex {
  db: string;
  store: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  recordCount: number;
  byteLength: number;
  truncated?: boolean;
  records: Array<{ key: Jsonable; value: Jsonable }>;
}

export interface StoreDump {
  db: string;
  store: string;
  index: StoreIndex;
  bin: Uint8Array;
}

export interface DumpResult {
  dumps: StoreDump[];
  databases: Array<{ name: string; version: number | null }>;
  errors: string[];
}

export interface DumpOptions {
  /** Database names to dump if `indexedDB.databases()` is unavailable. */
  fallbackNames?: string[];
  /** Database names to skip (e.g. the logger's own databases). */
  exclude?: (name: string) => boolean;
  /** Soft cap on bytes captured per store before truncating. */
  maxBytesPerStore?: number;
}

const DEFAULT_MAX_BYTES_PER_STORE = 1_500_000_000;

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function asBytes(value: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return new Uint8Array(value);
}

/** Accumulates binary blobs and hands back `{ $bin: [offset, length] }` refs. */
class BinSink {
  #chunks: Uint8Array[] = [];
  #offset = 0;

  get byteLength(): number {
    return this.#offset;
  }

  push(bytes: Uint8Array): { $bin: [number, number] } {
    const offset = this.#offset;
    this.#chunks.push(bytes);
    this.#offset += bytes.byteLength;
    return { $bin: [offset, bytes.byteLength] };
  }

  concat(): Uint8Array {
    const out = new Uint8Array(this.#offset);
    let at = 0;
    for (const chunk of this.#chunks) {
      out.set(chunk, at);
      at += chunk.byteLength;
    }
    return out;
  }
}

function encode(value: unknown, sink: BinSink): Jsonable {
  if (value === null || value === undefined) return null;

  const t = typeof value;
  if (t === "boolean" || t === "number" || t === "string") {
    return value as Jsonable;
  }
  if (t === "bigint") return { $bigint: (value as bigint).toString() };

  if (value instanceof Uint8Array || ArrayBuffer.isView(value)) {
    return sink.push(asBytes(value as ArrayBufferView));
  }
  if (value instanceof ArrayBuffer) {
    return sink.push(new Uint8Array(value));
  }
  if (value instanceof Date) return { $date: value.toISOString() };
  if (Array.isArray(value)) return value.map((v) => encode(v, sink));
  if (value instanceof Map) {
    return {
      $map: [...value.entries()].map(([k, v]) => [
        encode(k, sink),
        encode(v, sink),
      ]) as Jsonable,
    };
  }
  if (value instanceof Set) {
    return { $set: [...value].map((v) => encode(v, sink)) };
  }

  if (t === "object") {
    const out: { [key: string]: Jsonable } = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = encode(v, sink);
    }
    return out;
  }

  return String(value);
}

/**
 * Encode a list of `{ key, value }` records into the index + companion binary
 * buffer described in the module docstring. Pure (no IndexedDB) — shared by the
 * live cursor dump and usable directly in tests.
 */
export function encodeRecords(
  records: Array<{ key: unknown; value: unknown }>,
  maxBytes = Infinity
): {
  records: Array<{ key: Jsonable; value: Jsonable }>;
  bin: Uint8Array;
  truncated: boolean;
} {
  const sink = new BinSink();
  const encoded: Array<{ key: Jsonable; value: Jsonable }> = [];
  let truncated = false;
  for (const record of records) {
    if (sink.byteLength >= maxBytes) {
      truncated = true;
      break;
    }
    encoded.push({
      key: encode(record.key, sink),
      value: encode(record.value, sink),
    });
  }
  return { records: encoded, bin: sink.concat(), truncated };
}

/**
 * Inverse of {@link encodeRecords} — reconstruct the original `{ key, value }`
 * records from an index + its `.bin`. This is what the receiving end runs to
 * recover document chunks (resolve every `{ $bin: [offset, length] }` against
 * `bin.subarray(offset, offset + length)`).
 */
export function decodeStoreDump(
  records: Array<{ key: Jsonable; value: Jsonable }>,
  bin: Uint8Array
): Array<{ key: unknown; value: unknown }> {
  const resolve = (node: unknown): unknown => {
    if (node === null || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(resolve);
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.$bin)) {
      const [offset, length] = obj.$bin as [number, number];
      return bin.subarray(offset, offset + length);
    }
    if (typeof obj.$bigint === "string") return BigInt(obj.$bigint);
    if (typeof obj.$date === "string") return new Date(obj.$date);
    if (Array.isArray(obj.$set)) return new Set(obj.$set.map(resolve));
    if (Array.isArray(obj.$map)) {
      return new Map(
        (obj.$map as [Jsonable, Jsonable][]).map(([k, v]) => [
          resolve(k),
          resolve(v),
        ])
      );
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = resolve(v);
    return out;
  };
  return records.map((r) => ({ key: resolve(r.key), value: resolve(r.value) }));
}

async function dumpStore(
  db: IDBDatabase,
  dbName: string,
  storeName: string,
  maxBytes: number
): Promise<StoreDump> {
  const sink = new BinSink();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const records: StoreIndex["records"] = [];
  let truncated = false;

  await new Promise<void>((resolve, reject) => {
    const req = store.openCursor();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve();
      if (sink.byteLength >= maxBytes) {
        truncated = true;
        return resolve();
      }
      try {
        records.push({
          key: encode(cursor.key, sink),
          value: encode(cursor.value, sink),
        });
      } catch {
        // Skip a record we somehow can't encode rather than aborting the dump.
      }
      cursor.continue();
    };
  });

  const index: StoreIndex = {
    db: dbName,
    store: storeName,
    keyPath: store.keyPath as string | string[] | null,
    autoIncrement: store.autoIncrement,
    recordCount: records.length,
    byteLength: sink.byteLength,
    records,
  };
  if (truncated) index.truncated = true;

  return { db: dbName, store: storeName, index, bin: sink.concat() };
}

async function dumpDatabase(
  name: string,
  maxBytes: number
): Promise<{ dumps: StoreDump[]; version: number | null }> {
  const db = await promisify(indexedDB.open(name));
  try {
    const storeNames = [...db.objectStoreNames];
    const dumps: StoreDump[] = [];
    for (const storeName of storeNames) {
      dumps.push(await dumpStore(db, name, storeName, maxBytes));
    }
    return { dumps, version: db.version };
  } finally {
    db.close();
  }
}

/** Dump every (non-excluded) IndexedDB database for the origin. */
export async function dumpAllDatabases(
  options: DumpOptions = {}
): Promise<DumpResult> {
  const maxBytes = options.maxBytesPerStore ?? DEFAULT_MAX_BYTES_PER_STORE;
  const errors: string[] = [];

  let names: Array<{ name: string; version: number | null }> = [];
  try {
    if (typeof indexedDB.databases === "function") {
      const listed = await indexedDB.databases();
      names = listed
        .filter((d): d is { name: string; version: number } => !!d.name)
        .map((d) => ({ name: d.name, version: d.version ?? null }));
    }
  } catch (err) {
    errors.push(`indexedDB.databases() failed: ${String(err)}`);
  }
  if (names.length === 0 && options.fallbackNames) {
    names = options.fallbackNames.map((name) => ({ name, version: null }));
  }

  const dumps: StoreDump[] = [];
  const databases: DumpResult["databases"] = [];
  for (const { name, version } of names) {
    if (options.exclude?.(name)) continue;
    try {
      const result = await dumpDatabase(name, maxBytes);
      databases.push({ name, version: result.version ?? version });
      dumps.push(...result.dumps);
    } catch (err) {
      errors.push(`dumping ${name} failed: ${String(err)}`);
      databases.push({ name, version });
    }
  }

  return { dumps, databases, errors };
}

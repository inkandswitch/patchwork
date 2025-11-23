import * as Automerge from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import type { DynamicSegment } from "./types";
import { Ref } from "./ref";

/**
 * Mark a path segment as dynamic/unstable.
 *
 * By default, refs are stable:
 * - Numeric indices resolve to ObjectIds
 * - Where clauses resolve to ObjectIds
 * - Ranges convert to cursors
 *
 * Wrapping a segment in at() makes it dynamic:
 * - at(0) - Positional index (not ObjectId)
 * - at({ title: "x" }) - Re-query on each access
 * - at([10, 20]) - Numeric indices (not cursors)
 *
 * @example
 * ```ts
 * // Stable (resolves to ObjectId)
 * ref(handle, 'todos', 0)
 *
 * // Dynamic (positional index)
 * ref(handle, 'todos', at(0))
 * ```
 */
export function at<T>(segment: T): DynamicSegment<T> {
  return { __dynamic: true, value: segment };
}

/**
 * Find a ref by its Automerge URL.
 *
 * Takes a full Automerge URL (with optional ref path and heads) and returns
 * the corresponding Ref instance.
 *
 * URL format: `automerge:{docId}/{refPath}#{heads}`
 *
 * @param repo - The Automerge Repo to find the document in
 * @param url - The full Automerge URL with optional ref path
 * @returns A Promise that resolves to a Ref instance
 *
 * @example
 * ```ts
 * const url = "automerge:abc123/todos/$xyz/title";
 * const ref = await findRef(repo, url);
 * console.log(ref.value());
 * ```
 */
export async function findRef<T = any>(
  repo: Repo,
  url: string
): Promise<Ref<T>> {
  // Parse URL: automerge:{docId}/{path}#{heads}
  // Allow optional trailing slash
  const urlMatch = url.match(/^automerge:([^/#]+)(?:\/([^#]*))?(?:#(.+))?$/);
  if (!urlMatch) {
    throw new Error(`Invalid Automerge URL: ${url}`);
  }

  const [, docId, pathStr, headsStr] = urlMatch;

  // Get the document handle
  const handle = await repo.find(docId as any);

  // Wait for document to be ready
  await handle.whenReady();

  // Use Ref.fromUrl to parse path and construct the ref
  return Ref.fromUrl<T>(handle, pathStr || "", headsStr);
}

/**
 * Check if an item matches a where clause (all properties match).
 */
export function matchesWhereClause(
  item: any,
  clause: Record<string, any>
): boolean {
  return Object.entries(clause).every(([key, value]) => item[key] === value);
}

/**
 * Find the index of an item in an array by its ObjectId.
 * Returns -1 if not found.
 */
export function findIndexByObjectId(array: any[], objectId: string): number {
  return array.findIndex((item) => Automerge.getObjectId(item) === objectId);
}

/**
 * Find the index of an item in an array matching a where clause.
 * Returns -1 if not found.
 */
export function findIndexByWhereClause(
  array: any[],
  clause: Record<string, any>
): number {
  return array.findIndex((item) => matchesWhereClause(item, clause));
}

/**
 * Check if a value is a plain object (not an Automerge proxy or other special object).
 * This is more reliable than checking constructor across realms.
 */
export function isPlainObject(obj: any): obj is Record<string, any> {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  const proto = Object.getPrototypeOf(obj);
  return proto === null || proto === Object.prototype;
}

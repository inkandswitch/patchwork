import * as Automerge from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import type { PathSegment, PathInput } from "./types";
import { QUERY } from "./types";
import { Ref } from "./ref";

/**
 * Mark a path segment as unstable (prevents stabilization).
 *
 * By default, refs try to stabilize segments:
 * - Numeric indices resolve to ObjectIds
 * - Where clauses resolve to ObjectIds
 * - Ranges convert to cursors
 *
 * Wrapping a segment in at() prevents stabilization:
 * - at(0) - Positional index (not ObjectId)
 * - at({ title: "x" }) - Re-query on each access
 * - at([10, 20]) - Numeric indices (not cursors)
 *
 * @example
 * ```ts
 * // Stable (resolves to ObjectId)
 * ref(handle, 'todos', 0)
 *
 * // Unstable (positional index)
 * ref(handle, 'todos', at(0))
 * ```
 */
export function at(
  segment: string | number | Record<string, any> | [number, number]
): PathSegment {
  return { [QUERY]: segment };
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

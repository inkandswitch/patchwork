import * as Automerge from "@automerge/automerge";
import { DocHandle, Repo } from "@automerge/automerge-repo";
import type { PathSegment } from "./types";
import { QUERY } from "./types";
import { Ref } from "./ref";

/**
 * Prevent stabilization for a path segment.
 *
 * By default, refs are stable: numeric indices → ObjectIds, ranges → cursors.
 * Use `at()` to keep segments dynamic and positional.
 *
 * @example
 * ```ts
 * ref(handle, 'todos', 0)      // Stable: tracks by ObjectId
 * ref(handle, 'todos', at(0))  // Dynamic: always index 0
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
 * URL format: `automerge:{docId}/{path}#{heads}`
 *
 * @example
 * ```ts
 * const ref = await findRef(repo, "automerge:abc123/todos/$xyz/title");
 * ```
 */
export async function findRef<T = any>(
  repo: Repo,
  url: string
): Promise<Ref<T>> {
  const urlMatch = url.match(/^automerge:([^/#]+)(?:\/([^#]*))?(?:#(.+))?$/);
  if (!urlMatch) {
    throw new Error(`Invalid Automerge URL: ${url}`);
  }

  const [, docId, pathStr, headsStr] = urlMatch;
  const handle = await repo.find(docId as any);
  await handle.whenReady();

  return Ref.fromUrl(handle as DocHandle<T>, pathStr || "", headsStr);
}

export function matchesWhereClause(
  item: any,
  clause: Record<string, any>
): boolean {
  return Object.entries(clause).every(([key, value]) => item[key] === value);
}

export function findIndexByObjectId(array: any[], objectId: string): number {
  return array.findIndex((item) => Automerge.getObjectId(item) === objectId);
}

export function findIndexByWhereClause(
  array: any[],
  clause: Record<string, any>
): number {
  return array.findIndex((item) => matchesWhereClause(item, clause));
}

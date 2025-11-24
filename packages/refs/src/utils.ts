import { DocHandle, Repo } from "@automerge/automerge-repo";
import type { Segment } from "./types";
import { KIND } from "./types";
import { Ref } from "./ref";
import { parseUrl } from "./parser";

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
): Segment {
  if (typeof segment === "string") {
    return { [KIND]: "key", key: segment };
  }
  if (typeof segment === "number") {
    return { [KIND]: "index", index: segment };
  }
  if (Array.isArray(segment)) {
    return { [KIND]: "range", start: segment[0], end: segment[1] };
  }
  return { [KIND]: "query", clause: segment };
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
  const { docId } = parseUrl(url);
  const handle = await repo.find(docId as any);
  await handle.whenReady();

  return Ref.fromUrl(handle as DocHandle<T>, url);
}

export function matchesWhereClause(
  item: any,
  clause: Record<string, any>
): boolean {
  return Object.entries(clause).every(([key, value]) => item[key] === value);
}

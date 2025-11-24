import { DocHandle, Repo } from "@automerge/automerge-repo";
import type { Segment } from "./types";
import { KIND } from "./types";
import { Ref } from "./ref";
import { parseAutomergeRefUrl, type AutomergeRefUrl } from "./parser";

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
  return { [KIND]: "query", idPattern: segment };
}

/**
 * Find a ref by its Automerge URL.
 *
 * URL format: `automerge:{documentId}/{path}#{heads}`
 *
 * @example
 * ```ts
 * const ref = await findRef(repo, "automerge:abc123/todos/$xyz/title" as AutomergeRefUrl);
 * ```
 */
export async function findRef<T = any>(
  repo: Repo,
  url: AutomergeRefUrl
): Promise<Ref<T>> {
  const { documentId } = parseAutomergeRefUrl(url);
  const handle = await repo.find(documentId as any);
  await handle.whenReady();

  return Ref.fromUrl(handle as DocHandle<T>, url);
}

export function matchesIdPattern(
  item: any,
  idPattern: Record<string, any>
): boolean {
  return Object.entries(idPattern).every(([key, value]) => item[key] === value);
}

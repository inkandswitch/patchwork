import type { DocHandle } from "@automerge/automerge-repo";
import { Ref } from "./ref";
import type { PathBuilder } from "./types";

/**
 * Create a ref to a location in an Automerge document.
 *
 * This is a convenience wrapper around `new Ref()` that accepts
 * variadic arguments instead of an array.
 *
 * Refs are stable by default:
 * - Numeric indices resolve to ObjectIds
 * - Where clauses resolve to ObjectIds
 * - Ranges convert to cursors (TODO)
 *
 * Use `at()` to create dynamic/unstable refs.
 *
 * @example
 * ```ts
 * // Stable refs (survive reordering)
 * ref(handle, 'todos', 0, 'title')
 * ref(handle, 'todos', { id: 'abc' }, 'done')
 *
 * // Dynamic refs (positional)
 * ref(handle, 'todos', at(0), 'title')
 * ```
 */
export function ref<T = any>(
  docHandle: DocHandle<any>,
  ...segments: PathBuilder[]
): Ref<T> {
  return new Ref<T>(docHandle, segments);
}
